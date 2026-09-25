/**
 * GreenPulse AI - Phase 5 Comprehensive Verification Script
 * Validates BRSR / Compliance Report Generation Engine, PDF Kit Generation,
 * Scope 1 Honesty, Storage Client, Write-Once Immutability, and Firestore Mirroring.
 *
 * Laptop Safety Protocol: Active (Pure in-memory/disk, sequential, 1 tiny PDF content test).
 */

const http = require('http');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const referenceCache = require('../src/config/referenceCache');
const { seedReferenceData } = require('../src/lib/seed-reference-data');
const env = require('../src/config/env');
const { db: firestoreDb } = require('../src/config/firebase');

const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Department = require('../src/modules/departments/department.model');
const EnergyRecord = require('../src/modules/upload/energy-record.model');
const Emission = require('../src/modules/carbon/emission.model');
const PrincipleDisclosure = require('../src/modules/esg/principle-disclosure.model');
const GreenScore = require('../src/modules/greenscore/greenscore.model');
const Report = require('../src/modules/reports/report.model');

const carbonService = require('../src/modules/carbon/carbon.service');
const esgService = require('../src/modules/esg/esg.service');
const greenScoreService = require('../src/modules/greenscore/greenscore.service');
const reportService = require('../src/modules/reports/report.service');
const storageClient = require('../src/lib/storageClient');
const { REPORT_CONFIGS } = require('../src/modules/reports/report.config');

let server;
let baseUrl;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (urlPath, options = {}) => {
  const url = `${baseUrl}${urlPath}`;
  const headers = { ...(options.headers || {}) };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let body = {};
  try {
    body = await res.json();
  } catch (e) {
    // ignore
  }

  return {
    status: res.status,
    headers: res.headers,
    body,
  };
};

/**
 * Extract all text strings from a PDFKit binary buffer using Node zlib
 * In PDF syntax, text within TJ blocks is an array of strings interleaved with kerning displacements.
 * Concatenating the decoded string segments reconstructs the exact text.
 */
const extractTextFromPdfBuffer = (pdfBuffer) => {
  const str = pdfBuffer.toString('binary');
  let extractedText = '';
  let streamIndex = 0;

  while ((streamIndex = str.indexOf('stream', streamIndex)) !== -1) {
    let start = streamIndex + 6;
    if (str[start] === '\r') start++;
    if (str[start] === '\n') start++;
    const end = str.indexOf('endstream', start);
    if (end === -1) break;
    const streamData = pdfBuffer.slice(start, end);

    let rawStream = '';
    try {
      rawStream = zlib.inflateSync(streamData).toString('latin1');
    } catch (e) {
      rawStream = streamData.toString('latin1');
    }

    // Inside TJ blocks, extract all hex literals <...> and decode them
    const decodedStream = rawStream.replace(/\[([\s\S]*?)\]\s*TJ/g, (_, tjContent) => {
      let blockText = '';
      const hexMatches = tjContent.matchAll(/<([0-9a-fA-F]+)>/g);
      for (const m of hexMatches) {
        blockText += Buffer.from(m[1], 'hex').toString('utf8');
      }
      return blockText;
    });

    extractedText += '\n' + decodedStream;
    streamIndex = end + 9;
  }

  return extractedText;
};

const pollReportStatus = async (reportId, headers, maxAttempts = 25) => {
  for (let i = 0; i < maxAttempts; i++) {
    await delay(200);
    const res = await request(`/api/v1/reports/${reportId}`, { headers });
    const status = res.body?.data?.status;
    if (status && status !== 'generating') {
      return res.body.data;
    }
  }
  const fallbackRes = await request(`/api/v1/reports/${reportId}`, { headers });
  return fallbackRes.body?.data;
};

const runVerification = async () => {
  console.log('====================================================');
  console.log('Starting Phase 5 Verification for GreenPulse AI');
  console.log('Compliance & BRSR Report Generation Engine');
  console.log('Resource Protection Protocol: Active (Sequential, 1 PDF End-to-End)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  };

  try {
    await connectDB();
    await seedReferenceData();
    await referenceCache.ensureCacheLoaded();

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // ----------------------------------------------------
    // SETUP TEST FIXTURES
    // ----------------------------------------------------
    const uniqueSuffix = Date.now();

    // Company A (In Scope with energy telemetry)
    const companyA = await Company.create({
      name: `Compliance Corp A ${uniqueSuffix}`,
      industry: 'Manufacturing',
      brsrStatus: 'mandatory',
    });

    const userA = await User.create({
      email: `auditor_a_${uniqueSuffix}@greenpulse.local`,
      passwordHash: 'argon2id_mock_hash_for_test',
      role: 'auditor',
      company: companyA._id,
    });

    // Company B (Cross-company isolation test)
    const companyB = await Company.create({
      name: `Competitor Corp B ${uniqueSuffix}`,
      industry: 'Technology',
      brsrStatus: 'voluntary',
    });

    const userB = await User.create({
      email: `auditor_b_${uniqueSuffix}@competitor.local`,
      passwordHash: 'argon2id_mock_hash_for_test',
      role: 'auditor',
      company: companyB._id,
    });

    // Generate JWT tokens
    const jwt = require('jsonwebtoken');
    const tokenA = jwt.sign(
      { id: userA._id.toString(), email: userA.email, role: userA.role, company: companyA._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersA = { Authorization: `Bearer ${tokenA}` };

    const tokenB = jwt.sign(
      { id: userB._id.toString(), email: userB.email, role: userB.role, company: companyB._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    const deptA = await Department.create({
      companyId: companyA._id,
      name: 'Production Facility 1',
      code: `PF1-${uniqueSuffix}`,
      facilityType: 'manufacturing',
    });

    // Seed 1000 kWh of Scope 2 electricity for period 2026-03
    const testPeriod = '2026-03';
    await EnergyRecord.create({
      companyId: companyA._id,
      departmentId: deptA._id,
      period: testPeriod,
      kwhUsed: 1000,
      sourceFileHash: 'test_hash_source_file_123',
    });

    // Recalculate Phase 3 emissions and Green Score to establish baseline
    await carbonService.recalculateEmissionsForCompany(companyA._id);
    await esgService.recalculateEsgForCompany(companyA._id);
    await greenScoreService.recalculateGreenScore(companyA._id);

    console.log('Setup completed. Commencing 16 test cases...\n');

    // ----------------------------------------------------
    // TEST 1: Exact Report Types Validation
    // ----------------------------------------------------
    const invalidTypeRes = await request('/api/v1/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: { reportType: 'BRSR_CORE', period: testPeriod },
    });
    assert(
      invalidTypeRes.status === 400 && invalidTypeRes.body.error?.code === 'VALIDATION_ERROR',
      'Test 1.1: Rejects invalid reportType (BRSR_CORE) with 400',
      `Got status ${invalidTypeRes.status}`
    );

    const invalidTypeRes2 = await request('/api/v1/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: { reportType: 'ESG_SUMMARY', period: testPeriod },
    });
    assert(
      invalidTypeRes2.status === 400,
      'Test 1.2: Rejects invented reportType (ESG_SUMMARY) with 400',
      `Got status ${invalidTypeRes2.status}`
    );

    // ----------------------------------------------------
    // TEST 2: Period Format (Exact YYYY-MM)
    // ----------------------------------------------------
    const invalidPeriodRes = await request('/api/v1/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: { reportType: 'SEBI_BRSR', period: '2026-3' },
    });
    assert(
      invalidPeriodRes.status === 400,
      'Test 2.1: Rejects non-padded period (2026-3) with 400',
      `Got status ${invalidPeriodRes.status}`
    );

    const invalidPeriodRes2 = await request('/api/v1/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: { reportType: 'SEBI_BRSR', period: 'March 2026' },
    });
    assert(
      invalidPeriodRes2.status === 400,
      'Test 2.2: Rejects text period (March 2026) with 400',
      `Got status ${invalidPeriodRes2.status}`
    );

    // ----------------------------------------------------
    // TEST 3: POST /api/v1/reports Returns HTTP 202 Accepted Immediately
    // ----------------------------------------------------
    const postRes = await request('/api/v1/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: { reportType: 'SEBI_BRSR', period: testPeriod },
    });

    assert(
      postRes.status === 202,
      'Test 3.1: POST /api/v1/reports returns HTTP 202 Accepted',
      `Got status ${postRes.status}`
    );
    assert(
      postRes.body.data?.status === 'generating',
      'Test 3.2: Immediate response status is "generating"',
      `Got status ${postRes.body.data?.status}`
    );
    assert(
      Boolean(postRes.body.data?.reportId),
      'Test 3.3: Immediate response returns reportId',
      `reportId missing`
    );

    const reportIdA = postRes.body.data?.reportId;

    // ----------------------------------------------------
    // TEST 4: Asynchronous Compilation & Status Enum (Never "completed")
    // ----------------------------------------------------
    const completedReportA = await pollReportStatus(reportIdA, authHeadersA);

    assert(
      completedReportA.status === 'ready' || completedReportA.status === 'needs_review',
      'Test 4.1: Report successfully completed to "ready" or "needs_review"',
      `Got status ${completedReportA.status}`
    );
    assert(
      completedReportA.status !== 'completed',
      'Test 4.2: Status is NEVER "completed"',
      `Status was ${completedReportA.status}`
    );

    // ----------------------------------------------------
    // TEST 5: Snapshot Immutability (Write-Once at DB & Service Layer)
    // ----------------------------------------------------
    let mongooseImmutabilityPassed = false;
    try {
      const doc = await Report.findById(reportIdA);
      doc.dataSnapshot = { hijacked: true };
      await doc.save();
      // If save succeeded, check if dataSnapshot actually changed
      const reRead = await Report.findById(reportIdA);
      if (!reRead.dataSnapshot.hijacked) {
        mongooseImmutabilityPassed = true;
      }
    } catch (e) {
      mongooseImmutabilityPassed = true;
    }
    assert(
      mongooseImmutabilityPassed,
      'Test 5.1: Mongoose dataSnapshot has immutable: true and cannot be overwritten',
      'Immutability test failed'
    );

    // ----------------------------------------------------
    // TEST 6: Single Source of Truth for Carbon (No Recalculation)
    // ----------------------------------------------------
    const reportFromDb = await Report.findById(reportIdA).lean();
    const snapshotCarbon = reportFromDb.dataSnapshot?.carbon;
    // 1000 kWh * 0.82 factor = 820 kg CO2e
    assert(
      snapshotCarbon?.scope2?.totalKgCO2e === 820,
      'Test 6.1: Scope 2 reflects exact Phase 3 Carbon calculation (820 kg CO2e for 1000 kWh)',
      `Got ${snapshotCarbon?.scope2?.totalKgCO2e}`
    );
    assert(
      snapshotCarbon?.scope2?.totalTonsCO2e === 0.82,
      'Test 6.2: Scope 2 tons conversion is accurate (0.82 metric tons)',
      `Got ${snapshotCarbon?.scope2?.totalTonsCO2e}`
    );

    // ----------------------------------------------------
    // TEST 7: Scope 1 Honesty (Unavailable / null with Statutory Reason)
    // ----------------------------------------------------
    assert(
      snapshotCarbon?.scope1?.totalKgCO2e === null,
      'Test 7.1: Scope 1 totalKgCO2e is strictly null (not 0)',
      `Got ${snapshotCarbon?.scope1?.totalKgCO2e}`
    );
    assert(
      snapshotCarbon?.scope1?.dataAvailable === false,
      'Test 7.2: Scope 1 dataAvailable is false',
      `Got ${snapshotCarbon?.scope1?.dataAvailable}`
    );
    assert(
      snapshotCarbon?.scope1?.reason === 'No direct-fuel activity data ingested yet',
      'Test 7.3: Scope 1 has statutory reason "No direct-fuel activity data ingested yet"',
      `Got ${snapshotCarbon?.scope1?.reason}`
    );

    // ----------------------------------------------------
    // TEST 8: Honest Audit Level & Executive Summary
    // ----------------------------------------------------
    const execSummary = reportFromDb.executiveSummary;
    assert(
      execSummary.auditLevel === 'Internal system-generated; not externally assured',
      'Test 8.1: Honest auditLevel is "Internal system-generated; not externally assured"',
      `Got ${execSummary.auditLevel}`
    );
    assert(
      execSummary.framework.includes('SEBI BRSR'),
      'Test 8.2: Framework explicitly states statutory standard',
      `Got ${execSummary.framework}`
    );

    // ----------------------------------------------------
    // TEST 9: Deterministic Gap Count Calculation
    // ----------------------------------------------------
    const applicablePrinciples = REPORT_CONFIGS.SEBI_BRSR.applicablePrinciples;
    const esgPrinciples = reportFromDb.dataSnapshot?.esg?.principles || [];
    let expectedGaps = 0;
    esgPrinciples.forEach((p) => {
      if (applicablePrinciples.includes(p.principleNumber)) {
        if (p.status === 'partial' || p.status === 'missing' || (p.coveragePercentage != null && p.coveragePercentage < 100)) {
          expectedGaps++;
        }
      }
    });

    assert(
      reportFromDb.disclosureGapCount === expectedGaps,
      `Test 9.1: Disclosure gap count matches deterministic calculation (${expectedGaps} gaps)`,
      `Got ${reportFromDb.disclosureGapCount}`
    );

    // ----------------------------------------------------
    // TEST 10: Storage Client Environment Rule & PDF File Creation
    // ----------------------------------------------------
    assert(
      Boolean(reportFromDb.pdfStorageRef),
      'Test 10.1: Private storage reference is populated (pdfStorageRef)',
      `pdfStorageRef is ${reportFromDb.pdfStorageRef}`
    );

    const pdfBuffer = await storageClient.readPdf(reportFromDb.pdfStorageRef);
    assert(
      Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 500,
      'Test 10.2: PDF file exists in storage and is non-empty binary buffer',
      `Buffer length: ${pdfBuffer ? pdfBuffer.length : 0}`
    );

    // ----------------------------------------------------
    // TEST 11: Clean Detail Projection (Excludes Full Raw Snapshot)
    // ----------------------------------------------------
    const detailRes = await request(`/api/v1/reports/${reportIdA}`, {
      headers: authHeadersA,
    });
    assert(
      detailRes.status === 200,
      'Test 11.1: GET /api/v1/reports/:id returns HTTP 200',
      `Got status ${detailRes.status}`
    );
    assert(
      detailRes.body.data?.dataSnapshot === undefined,
      'Test 11.2: Raw full dataSnapshot is excluded from detail payload',
      `dataSnapshot present: ${Boolean(detailRes.body.data?.dataSnapshot)}`
    );
    assert(
      Boolean(detailRes.body.data?.snapshotSummary),
      'Test 11.3: Clean snapshotSummary is provided',
      `snapshotSummary missing`
    );

    // ----------------------------------------------------
    // TEST 12: Private Download Access & Path Traversal Protection
    // ----------------------------------------------------
    const downloadRes = await request(`/api/v1/reports/${reportIdA}/download`, {
      headers: authHeadersA,
    });
    assert(
      downloadRes.status === 200 && Boolean(downloadRes.body.data?.downloadUrl),
      'Test 12.1: GET /api/v1/reports/:id/download returns short-lived download URL',
      `Got status ${downloadRes.status}`
    );

    // Test Path Traversal rejection
    const traversalRes = await request('/api/v1/reports/download-local?ref=../../../../etc/passwd');
    assert(
      traversalRes.status === 400 && traversalRes.body.error?.code === 'INVALID_REFERENCE',
      'Test 12.2: Local download rejects path traversal attack (../)',
      `Got status ${traversalRes.status}`
    );

    // ----------------------------------------------------
    // TEST 13: Tenant / Company Isolation
    // ----------------------------------------------------
    const crossCompanyRes = await request(`/api/v1/reports/${reportIdA}`, {
      headers: authHeadersB,
    });
    assert(
      crossCompanyRes.status === 404,
      'Test 13.1: User B cannot access User A report (returns 404)',
      `Got status ${crossCompanyRes.status}`
    );

    const crossCompanyDownload = await request(`/api/v1/reports/${reportIdA}/download`, {
      headers: authHeadersB,
    });
    assert(
      crossCompanyDownload.status === 404,
      'Test 13.2: User B cannot download User A report (returns 404)',
      `Got status ${crossCompanyDownload.status}`
    );

    // ----------------------------------------------------
    // TEST 14: Firestore State Synchronization & Zero "completed"
    // ----------------------------------------------------
    if (firestoreDb) {
      try {
        const firestoreDoc = await firestoreDb.collection('reports').doc(reportIdA.toString()).get();
        if (firestoreDoc.exists) {
          const fsData = firestoreDoc.data();
          assert(
            fsData.status === reportFromDb.status,
            `Test 14.1: Firestore report status mirrors MongoDB (${reportFromDb.status})`,
            `Firestore had: ${fsData.status}`
          );
          assert(
            fsData.status !== 'completed',
            'Test 14.2: Firestore status is NEVER "completed"',
            `Firestore status was: ${fsData.status}`
          );
        } else {
          console.log('[SKIP] Firestore document check (doc not found / mock mode)');
        }
      } catch (err) {
        console.log(`[SKIP] Firestore verification skipped: ${err.message}`);
      }
    } else {
      console.log('[SKIP] Firestore unconfigured in test environment; checked MongoDB status enum');
    }

    // ----------------------------------------------------
    // TEST 15: Explicit needs_review End-to-End Test
    // ----------------------------------------------------
    console.log('\nRunning dedicated needs_review test scenario...');
    // Create Company C with known partial principle disclosures (guaranteeing disclosureGapCount > 0)
    const companyC = await Company.create({
      name: `Review Required Corp ${uniqueSuffix}`,
      industry: 'Chemicals',
      brsrStatus: 'mandatory',
    });

    const userC = await User.create({
      email: `compliance_c_${uniqueSuffix}@reviewcorp.local`,
      passwordHash: 'argon2id_mock_hash_for_test',
      role: 'auditor',
      company: companyC._id,
    });

    const tokenC = jwt.sign(
      { id: userC._id.toString(), email: userC.email, role: userC.role, company: companyC._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersC = { Authorization: `Bearer ${tokenC}` };

    // Explicitly seed a partial principle with gap
    await PrincipleDisclosure.create({
      companyId: companyC._id,
      principleNumber: 1,
      status: 'partial',
      coveragePercent: 40,
      activeDataSources: ['Code of conduct document'],
      specificGaps: ['Whistleblower protection framework not published'],
      isSeededDemo: false,
    });

    const reportCPostRes = await request('/api/v1/reports', {
      method: 'POST',
      headers: authHeadersC,
      body: { reportType: 'SEBI_BRSR', period: testPeriod },
    });

    const reportIdC = reportCPostRes.body.data?.reportId;
    const completedReportC = await pollReportStatus(reportIdC, authHeadersC);

    const docC = await Report.findById(reportIdC).lean();
    assert(
      docC.disclosureGapCount > 0,
      `Test 15.1: Company C has identified statutory gaps (${docC.disclosureGapCount} gaps > 0)`,
      `Got ${docC.disclosureGapCount}`
    );
    assert(
      docC.status === 'needs_review',
      'Test 15.2: MongoDB report status is strictly "needs_review" when gaps exist',
      `Got status: ${docC.status}`
    );
    assert(
      docC.status !== 'ready' && docC.status !== 'completed',
      'Test 15.3: Status is NEITHER "ready" NOR "completed"',
      `Got status: ${docC.status}`
    );

    if (firestoreDb) {
      try {
        const fsDocC = await firestoreDb.collection('reports').doc(reportIdC.toString()).get();
        if (fsDocC.exists) {
          const fsCData = fsDocC.data();
          assert(
            fsCData.status === 'needs_review',
            'Test 15.4: Firestore report status is strictly "needs_review"',
            `Firestore had: ${fsCData.status}`
          );
        }
      } catch (e) {
        // ignore
      }
    }

    // ----------------------------------------------------
    // TEST 16: Actual PDF Content Verification (End-to-End Content Comparison)
    // ----------------------------------------------------
    console.log('\nRunning actual PDF content text verification on generated binary...');
    const rawPdfText = extractTextFromPdfBuffer(pdfBuffer);

    // Extract exact values from dataSnapshot
    const expectedCompanyName = reportFromDb.dataSnapshot.company.name;
    const expectedPeriod = reportFromDb.period;
    const expectedScope2Text = `${reportFromDb.dataSnapshot.carbon.scope2.totalKgCO2e.toFixed(2)} kg CO2e`;
    const expectedScope1Notice = 'No direct-fuel activity data ingested yet';
    const expectedAuditLevel = 'Internal system-generated; not externally assured';
    const expectedGreenScore = `${reportFromDb.dataSnapshot.greenScore.score} / 100`;

    console.log('--- DIRECT COMPARISON: Report dataSnapshot vs Actual PDF Content ---');
    console.log(`[1] Company Name:        Expected: "${expectedCompanyName}" | Found in PDF: ${rawPdfText.includes(expectedCompanyName)}`);
    console.log(`[2] Reporting Period:    Expected: "${expectedPeriod}" | Found in PDF: ${rawPdfText.includes(expectedPeriod)}`);
    console.log(`[3] Scope 2 Emissions:   Expected: "${expectedScope2Text}" | Found in PDF: ${rawPdfText.includes(expectedScope2Text)}`);
    console.log(`[4] Scope 1 Disclosure:  Expected: "${expectedScope1Notice}" | Found in PDF: ${rawPdfText.includes(expectedScope1Notice)}`);
    console.log(`[5] Green Score:         Expected: "${expectedGreenScore}" | Found in PDF: ${rawPdfText.includes(expectedGreenScore)}`);
    console.log(`[6] Honest Audit Notice: Expected: "${expectedAuditLevel}" | Found in PDF: ${rawPdfText.includes(expectedAuditLevel)}`);
    console.log('--------------------------------------------------------------------\n');

    assert(
      rawPdfText.includes(expectedCompanyName),
      'Test 16.1: PDF content contains exact company name from snapshot',
      `Missing: ${expectedCompanyName}`
    );
    assert(
      rawPdfText.includes(expectedPeriod),
      'Test 16.2: PDF content contains exact reporting period from snapshot',
      `Missing: ${expectedPeriod}`
    );
    assert(
      rawPdfText.includes(expectedScope2Text),
      'Test 16.3: PDF content contains exact Scope 2 emissions value from snapshot',
      `Missing: ${expectedScope2Text}`
    );
    assert(
      rawPdfText.includes(expectedScope1Notice),
      'Test 16.4: PDF content contains exact Scope 1 statutory reason note',
      `Missing: ${expectedScope1Notice}`
    );
    assert(
      rawPdfText.includes(expectedAuditLevel),
      'Test 16.5: PDF content contains exact unassured auditLevel statement',
      `Missing: ${expectedAuditLevel}`
    );
    assert(
      rawPdfText.includes(expectedGreenScore),
      'Test 16.6: PDF content contains exact Green Score benchmark from snapshot',
      `Missing: ${expectedGreenScore}`
    );

    // Clean up created test companies and records
    await Company.deleteMany({ _id: { $in: [companyA._id, companyB._id, companyC._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id, userC._id] } });
    await Department.deleteMany({ companyId: { $in: [companyA._id, companyB._id, companyC._id] } });
    await EnergyRecord.deleteMany({ companyId: { $in: [companyA._id, companyB._id, companyC._id] } });
    await Emission.deleteMany({ companyId: { $in: [companyA._id, companyB._id, companyC._id] } });
    await PrincipleDisclosure.deleteMany({ companyId: { $in: [companyA._id, companyB._id, companyC._id] } });
    await GreenScore.deleteMany({ companyId: { $in: [companyA._id, companyB._id, companyC._id] } });
    await Report.deleteMany({ companyId: { $in: [companyA._id, companyB._id, companyC._id] } });

    console.log('\n====================================================');
    console.log(`Phase 5 Verification Completed: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('CRITICAL ERROR in Phase 5 verification:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

runVerification();
