const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');
const path = require('path');
const UploadJob = require('../modules/upload/upload-job.model');
const EnergyRecord = require('../modules/upload/energy-record.model');
const WasteRecord = require('../modules/upload/waste-record.model');
const FuelRecord = require('../modules/upload/fuel-record.model');
const Department = require('../modules/departments/department.model');
const departmentService = require('../modules/departments/department.service');
const {
  energyRowSchema,
  wasteRowSchema,
  fuelRowSchema,
  classifyWasteItem,
  periodRegex,
  preprocessPeriod,
} = require('../modules/upload/upload.validator');
const { calculateFuelEmissions, getFuelFactors, normalizeFuelType } = require('../modules/carbon/fuel-factor.registry');
const { normalizeRowHeaders } = require('../utils/headerNormalizer');
const { normalizeDepartmentName, normalizeWasteItem } = require('../utils/textNormalizer');
const { db: firestoreDb } = require('../config/firebase');
const logger = require('../lib/logger');
const { runRecomputationPipeline } = require('./recomputation.pipeline');
const { runPhase4Pipeline } = require('./phase4.pipeline');
const { logAuditEvent } = require('../modules/audit/auditLogger');

/**
 * Mirror job updates to Firestore in real-time
 */
const syncJobToFirestore = async (jobId, data) => {
  if (!firestoreDb) return;
  try {
    const plainData = data ? JSON.parse(JSON.stringify(data)) : {};
    const docRef = firestoreDb.collection('jobs').doc(jobId.toString());
    await docRef.set(
      {
        ...plainData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    logger.warn({ err: err.message, jobId }, 'Failed to sync job status to Firestore');
  }
};

/**
 * Asynchronous job processor for parsing, validating, and persisting uploads
 * Implements deterministic header normalization, lowercase department resolution,
 * atomic validation, multi-activity template ingestion, and post-upload recomputation.
 */
const processUploadJob = async ({ jobId, fileBuffer, companyId, filename, fileType, contentHash }) => {
  try {
    const job = await UploadJob.findById(jobId);
    if (!job) {
      logger.error({ jobId }, 'UploadJob not found in database');
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();

    await syncJobToFirestore(jobId, {
      id: jobId.toString(),
      companyId: companyId.toString(),
      status: 'processing',
      filename,
      startedAt: job.startedAt.toISOString(),
    });

    // 1. Parse raw records based on file extension
    const ext = path.extname(filename).toLowerCase();
    let rawRecords = [];

    if (ext === '.csv') {
      rawRecords = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawRecords = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    }

    if (!rawRecords || rawRecords.length === 0) {
      job.status = 'failed';
      job.errorDetail = [{ row: 1, field: 'file', message: 'The uploaded file is empty or has no valid rows' }];
      job.completedAt = new Date();
      await job.save();

      await syncJobToFirestore(jobId, {
        status: 'failed',
        errorDetail: job.errorDetail,
        completedAt: job.completedAt.toISOString(),
      });
      return;
    }

    // 2. PASS 1: Normalize headers & validate rows atomically
    // Supports single-purpose files as well as multi-activity templates
    const rowErrors = [];
    const validatedRows = [];
    const referencedDepts = new Map(); // normDept -> sample raw dept name

    let totalEnergyRows = 0;
    let totalFuelRows = 0;
    let totalWasteRows = 0;

    for (let i = 0; i < rawRecords.length; i++) {
      const rawRow = rawRecords[i];
      // Skip completely empty rows (common at bottom of Excel sheets)
      if (!rawRow || typeof rawRow !== 'object') continue;
      const isBlank = Object.values(rawRow).every(
        (v) => v === undefined || v === null || String(v).trim() === ''
      );
      if (isBlank) continue;

      const rowNum = i + 1;
      const normalizedRow = normalizeRowHeaders(rawRow);

      // 1. Department Validation
      const rawDept = String(normalizedRow.department || '').trim();
      const normDept = normalizeDepartmentName(rawDept);
      if (!rawDept || !normDept) {
        rowErrors.push({
          row: rowNum,
          field: 'department',
          message: 'Please enter a department name.',
        });
        continue;
      }

      // 2. Period Validation
      const rawPeriod = preprocessPeriod(normalizedRow.period);
      if (!rawPeriod || !periodRegex.test(rawPeriod)) {
        rowErrors.push({
          row: rowNum,
          field: 'period',
          message: 'Period must be in YYYY-MM format (e.g. 2026-07)',
        });
      }

      // 3. Activity Field Detection & Validation
      // 3a. Electricity Activity
      let hasElectricity = false;
      let kwhVal = null;
      if (
        normalizedRow.kwhUsed !== undefined &&
        normalizedRow.kwhUsed !== null &&
        String(normalizedRow.kwhUsed).trim() !== ''
      ) {
        const kwhNum = Number(String(normalizedRow.kwhUsed).trim());
        if (Number.isNaN(kwhNum) || kwhNum < 0) {
          rowErrors.push({
            row: rowNum,
            field: 'kwhUsed',
            message: 'Electricity must be a non-negative number.',
          });
        } else {
          hasElectricity = true;
          kwhVal = kwhNum;
        }
      }

      // 3b. Fuel Activity
      let hasFuel = false;
      let fuelData = null;
      const fuelTypeStr =
        normalizedRow.fuelType !== undefined && normalizedRow.fuelType !== null
          ? String(normalizedRow.fuelType).trim()
          : '';
      const fuelQtyRaw = normalizedRow.fuelQuantity;
      const fuelQtyStr =
        fuelQtyRaw !== undefined && fuelQtyRaw !== null ? String(fuelQtyRaw).trim() : '';
      const fuelUnitStr =
        normalizedRow.fuelUnit !== undefined && normalizedRow.fuelUnit !== null
          ? String(normalizedRow.fuelUnit).trim()
          : '';

      const anyFuelSpecified = fuelTypeStr !== '' || fuelQtyStr !== '' || fuelUnitStr !== '';
      if (anyFuelSpecified) {
        if (!fuelTypeStr || fuelQtyStr === '' || !fuelUnitStr) {
          rowErrors.push({
            row: rowNum,
            field: !fuelTypeStr ? 'fuelType' : !fuelUnitStr ? 'fuelUnit' : 'fuelQuantity',
            message: 'Unsupported fuel type or unit.',
          });
        } else {
          const fuelQtyNum = Number(fuelQtyStr);
          if (Number.isNaN(fuelQtyNum) || fuelQtyNum < 0) {
            rowErrors.push({
              row: rowNum,
              field: 'fuelQuantity',
              message: 'Fuel quantity must be a non-negative number.',
            });
          } else {
            const fuelFactors = getFuelFactors(fuelTypeStr, fuelUnitStr);
            if (!fuelFactors.valid) {
              const canonicalType = normalizeFuelType(fuelTypeStr);
              rowErrors.push({
                row: rowNum,
                field: !canonicalType ? 'fuelType' : 'fuelUnit',
                message: fuelFactors.error || 'Unsupported fuel type or unit.',
              });
            } else {
              hasFuel = true;
              fuelData = {
                fuelType: fuelTypeStr,
                fuelQuantity: fuelQtyNum,
                fuelUnit: fuelUnitStr,
              };
            }
          }
        }
      }

      // 3c. Waste Activity
      let hasWaste = false;
      let wasteData = null;
      const wasteItemStr =
        normalizedRow.wasteItem !== undefined && normalizedRow.wasteItem !== null
          ? String(normalizedRow.wasteItem).trim()
          : '';
      const wasteQtyRaw = normalizedRow.quantityKg;
      const wasteQtyStr =
        wasteQtyRaw !== undefined && wasteQtyRaw !== null ? String(wasteQtyRaw).trim() : '';
      const wasteCatStr =
        normalizedRow.wasteCategory !== undefined && normalizedRow.wasteCategory !== null
          ? String(normalizedRow.wasteCategory).trim()
          : '';

      const anyWasteSpecified = wasteItemStr !== '' || wasteQtyStr !== '';
      if (anyWasteSpecified) {
        if (!wasteItemStr) {
          rowErrors.push({
            row: rowNum,
            field: 'wasteItem',
            message: 'Waste item is not recognized by GreenPulse.',
          });
        } else {
          const classification = classifyWasteItem(wasteItemStr);
          if (!classification.valid) {
            rowErrors.push({
              row: rowNum,
              field: 'wasteItem',
              message: classification.error || 'Waste item is not recognized by GreenPulse.',
            });
          } else {
            if (wasteQtyStr === '') {
              rowErrors.push({
                row: rowNum,
                field: 'quantityKg',
                message: 'Waste produced must be a non-negative number.',
              });
            } else {
              const wasteQtyNum = Number(wasteQtyStr);
              if (Number.isNaN(wasteQtyNum) || wasteQtyNum < 0) {
                rowErrors.push({
                  row: rowNum,
                  field: 'quantityKg',
                  message: 'Quantity must be a valid number',
                });
              } else {
                // Section 4: Authoritative Waste Category check
                let catMismatch = false;
                if (wasteCatStr) {
                  const normUserCat = normalizeWasteItem(wasteCatStr);
                  const normClassCat = normalizeWasteItem(classification.category);
                  if (normUserCat !== normClassCat) {
                    catMismatch = true;
                    rowErrors.push({
                      row: rowNum,
                      field: 'wasteCategory',
                      message: 'Waste category does not match the selected waste item.',
                    });
                  }
                }

                if (!catMismatch) {
                  hasWaste = true;
                  wasteData = {
                    wasteItem: wasteItemStr,
                    quantityKg: wasteQtyNum,
                    classification,
                  };
                }
              }
            }
          }
        }
      }

      // Check that at least one valid activity was found
      if (!hasElectricity && !anyFuelSpecified && !anyWasteSpecified) {
        rowErrors.push({
          row: rowNum,
          field: 'activity',
          message: 'Row must contain at least one activity: electricity, fuel, or waste.',
        });
        continue;
      }

      if (!referencedDepts.has(normDept)) {
        referencedDepts.set(normDept, rawDept);
      }

      if (hasElectricity) totalEnergyRows++;
      if (hasFuel) totalFuelRows++;
      if (hasWaste) totalWasteRows++;

      validatedRows.push({
        rowNum,
        normDept,
        rawDept,
        period: rawPeriod,
        hasElectricity,
        kwhUsed: kwhVal,
        hasFuel,
        fuelData,
        hasWaste,
        wasteData,
      });
    }

    // 4. ATOMIC CHECK: If ANY row failed, reject the entire file without persisting records or departments
    if (rowErrors.length > 0) {
      job.status = 'failed';
      job.errorDetail = rowErrors;
      job.rowCount = rawRecords.length;
      job.processedCount = 0;
      job.completedAt = new Date();
      await job.save();

      await syncJobToFirestore(jobId, {
        status: 'failed',
        errorDetail: rowErrors,
        rowCount: rawRecords.length,
        processedCount: 0,
        completedAt: job.completedAt.toISOString(),
      });

      logger.info({ jobId, errorCount: rowErrors.length }, 'Upload job validation failed with row-level errors');
      return;
    }

    if (validatedRows.length === 0) {
      job.status = 'failed';
      job.errorDetail = [{ row: 1, field: 'file', message: 'The uploaded file is empty or has no valid rows' }];
      job.rowCount = rawRecords.length;
      job.processedCount = 0;
      job.completedAt = new Date();
      await job.save();

      await syncJobToFirestore(jobId, {
        status: 'failed',
        errorDetail: job.errorDetail,
        rowCount: rawRecords.length,
        processedCount: 0,
        completedAt: job.completedAt.toISOString(),
      });
      return;
    }

    // 5. PASS 2: All rows are valid. Resolve or create company-scoped departments deterministically.
    const resolvedDepts = new Map(); // normDept -> Department doc
    for (const [normDept, rawDept] of referencedDepts.entries()) {
      const deptDoc = await departmentService.resolveOrCreateDepartment(companyId, rawDept);
      resolvedDepts.set(normDept, deptDoc);
    }

    // 6. Bulk insert business records with resolved department IDs
    const energyDocs = [];
    const fuelDocs = [];
    const wasteDocs = [];

    for (const row of validatedRows) {
      const dept = resolvedDepts.get(row.normDept);

      if (row.hasElectricity) {
        energyDocs.push({
          companyId,
          departmentId: dept._id,
          period: row.period,
          kwhUsed: row.kwhUsed,
          sourceFileHash: contentHash,
          uploadJobId: job._id,
        });
      }

      if (row.hasFuel) {
        const emissions = calculateFuelEmissions(
          row.fuelData.fuelType,
          row.fuelData.fuelQuantity,
          row.fuelData.fuelUnit
        );
        fuelDocs.push({
          companyId,
          departmentId: dept._id,
          period: row.period,
          fuelType: emissions.fuelType,
          fuelQuantity: row.fuelData.fuelQuantity,
          fuelUnit: emissions.fuelUnit,
          co2eScope1: emissions.co2eScope1,
          co2eScope3: emissions.co2eScope3,
          factorScope1: emissions.factorScope1,
          factorScope3: emissions.factorScope3,
          factorVersion: emissions.factorVersion,
          sourceFileHash: contentHash,
          uploadJobId: job._id,
        });
      }

      if (row.hasWaste) {
        const classification = row.wasteData.classification;
        wasteDocs.push({
          companyId,
          departmentId: dept._id,
          period: row.period,
          quantityKg: row.wasteData.quantityKg,
          rawWasteItem: classification.rawWasteItem,
          matchedKeyword: classification.matchedKeyword,
          category: classification.category,
          subcategory: classification.subcategory,
          sourceFileHash: contentHash,
          uploadJobId: job._id,
        });
      }
    }

    if (energyDocs.length > 0) await EnergyRecord.insertMany(energyDocs);
    if (fuelDocs.length > 0) await FuelRecord.insertMany(fuelDocs);
    if (wasteDocs.length > 0) await WasteRecord.insertMany(wasteDocs);

    // Determine canonical fileType for job record
    let determinedFileType = fileType;
    if (!determinedFileType) {
      const hasE = energyDocs.length > 0;
      const hasF = fuelDocs.length > 0;
      const hasW = wasteDocs.length > 0;
      const typeCount = (hasE ? 1 : 0) + (hasF ? 1 : 0) + (hasW ? 1 : 0);
      if (typeCount > 1) {
        determinedFileType = 'combined';
      } else if (hasF) {
        determinedFileType = 'fuel';
      } else if (hasW) {
        determinedFileType = 'waste';
      } else {
        determinedFileType = 'energy';
      }
    }
    job.fileType = determinedFileType;

    // 7. Mark job completed
    job.status = 'completed';
    job.rowCount = rawRecords.length;
    job.processedCount = validatedRows.length;
    job.completedAt = new Date();
    await job.save();

    await syncJobToFirestore(jobId, {
      status: 'completed',
      rowCount: rawRecords.length,
      processedCount: validatedRows.length,
      completedAt: job.completedAt.toISOString(),
    });

    await logAuditEvent({
      companyId: job.companyId,
      actorId: job.companyId,
      action: 'upload.completed',
    });

    logger.info({ jobId, count: validatedRows.length }, 'Upload job successfully processed and persisted');

    // 8. Trigger recomputation pipeline (Carbon -> ESG -> GreenScore -> Phase 4)
    setImmediate(async () => {
      try {
        const recomputationResult = await runRecomputationPipeline({ companyId, jobId: job._id });
        if (recomputationResult?.success) {
          // Phase 4: Run Energy Anomaly Detection & Recommendation Engine
          await runPhase4Pipeline({ companyId, jobId: job._id });
        }
      } catch (pipeErr) {
        logger.error({ jobId, companyId, err: pipeErr.message }, 'Unhandled error in recomputation pipeline');
      }
    });
  } catch (error) {
    logger.error({ err: error.message, jobId }, 'Unexpected error in processUploadJob');
    try {
      const job = await UploadJob.findById(jobId);
      if (job) {
        job.status = 'failed';
        job.errorDetail = [{ row: 0, field: 'general', message: error.message || 'Processing error' }];
        job.completedAt = new Date();
        await job.save();

        await syncJobToFirestore(jobId, {
          status: 'failed',
          errorDetail: job.errorDetail,
          completedAt: job.completedAt.toISOString(),
        });
      }
    } catch (saveErr) {
      logger.error({ err: saveErr.message }, 'Failed to record job failure state');
    }
  }
};

module.exports = {
  processUploadJob,
  syncJobToFirestore,
};
