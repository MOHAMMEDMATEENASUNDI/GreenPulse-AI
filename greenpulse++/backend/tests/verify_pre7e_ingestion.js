/**
 * GreenPulse AI — Pre-7E Flexible Data Ingestion Verification Suite
 *
 * Verifies Test Cases A through R:
 * A. Existing department — normal case ('Paint Shop')
 * B. Existing department — uppercase ('PAINT SHOP')
 * C. Existing department — mixed case ('PaInT ShOp')
 * D. Existing department — extra spaces ('  Paint   Shop  ')
 * E. New department ('Fabrication' created under company)
 * F. Same new department repeated in one upload ('Fabrication', 'FABRICATION', 'fabrication' -> ONE dept)
 * G. Same department across different companies (Company A vs Company B isolation)
 * H. Existing department + new waste type ('Paint Shop' + 'Used Oil')
 * I. New department + recognized waste ('Fabrication' + 'Plastic')
 * J. Waste capitalization ('USED OIL', 'used oil', 'Used Oil')
 * K. Unknown waste ('Radioactive Sludge' -> rejection & zero persistence)
 * L. Header aliases (Electricity_KWh, scrap_type, weight_kg, Department Name, reporting_period)
 * M. Negative kWh -> rejected
 * N. Negative waste quantity -> rejected
 * O. Carbon column (carbon = 9999 -> does not override GreenPulse calculations)
 * P. Fuel column (fuel_litres = 500 -> does not become Scope 1)
 * Q. Duplicate upload -> idempotency returns existing completed job
 * R. Regression -> summary metrics remain healthy
 */

process.env.NODE_ENV = 'test';

const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Department = require('../src/modules/departments/department.model');
const UploadJob = require('../src/modules/upload/upload-job.model');
const EnergyRecord = require('../src/modules/upload/energy-record.model');
const WasteRecord = require('../src/modules/upload/waste-record.model');
const departmentService = require('../src/modules/departments/department.service');
const { normalizeHeader, normalizeRowHeaders } = require('../src/utils/headerNormalizer');
const { normalizeDepartmentName, normalizeWasteItem } = require('../src/utils/textNormalizer');
const { classifyWasteItem } = require('../src/modules/waste/waste.classifier');
const { energyRowSchema, wasteRowSchema } = require('../src/modules/upload/upload.validator');

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    if (options.isMultipart) {
      fetchOptions.body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, fetchOptions);
  let body = {};
  try {
    body = await res.json();
  } catch (e) {
    // non-JSON
  }

  const rawSetCookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean);

  return {
    status: res.status,
    headers: res.headers,
    body,
    rawSetCookies,
  };
};

const extractCookie = (setCookieHeaders, cookieName = 'accessToken') => {
  for (const header of setCookieHeaders) {
    const match = header.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
};

const getJobId = (res) => {
  const id = res?.body?.data?.jobId || res?.body?.data?.id || res?.body?.data?.job?._id;
  if (!id) {
    console.error('Failed to get jobId from response:', res?.status, JSON.stringify(res?.body));
  }
  return id;
};

const pollJobUntilDone = async (cookie, jobId, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await request(`/api/v1/upload/jobs/${jobId}`, {
      headers: { Cookie: `accessToken=${cookie}` },
    });
    const job = res.body?.data?.job || res.body?.data;
    if (job) {
      const { status } = job;
      if (status === 'completed' || status === 'failed') {
        return job;
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Job ${jobId} did not complete within timeout`);
};

async function runTests() {
  console.log('====================================================');
  console.log('🌿 GREENPULSE AI — PRE-7E FLEXIBLE INGESTION SUITE');
  console.log('====================================================\n');

  await connectDB();
  await departmentService.backfillNormalizedNames();

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running on port ${port}`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // UNIT TESTS: Header Normalizer & Text Normalizer
    // -------------------------------------------------------------
    console.log('\n--- 1. Header Normalizer Unit Verification ---');

    assert(normalizeHeader('kwhUsed') === 'kwhUsed', 'kwhUsed matches exact canonical');
    assert(normalizeHeader('kwh_used') === 'kwhUsed', 'kwh_used matches canonical');
    assert(normalizeHeader('KWH_USED') === 'kwhUsed', 'KWH_USED uppercase matches canonical');
    assert(normalizeHeader('Electricity_KWh') === 'kwhUsed', 'Electricity_KWh matches canonical');
    assert(normalizeHeader('electricity consumption') === 'kwhUsed', 'electricity consumption matches canonical');
    assert(normalizeHeader('Energy Consumed') === 'kwhUsed', 'Energy Consumed matches canonical');

    assert(normalizeHeader('wasteItem') === 'wasteItem', 'wasteItem matches exact canonical');
    assert(normalizeHeader('waste_item') === 'wasteItem', 'waste_item matches canonical');
    assert(normalizeHeader('WASTE ITEM') === 'wasteItem', 'WASTE ITEM matches canonical');
    assert(normalizeHeader('waste material') === 'wasteItem', 'waste material matches canonical');
    assert(normalizeHeader('scrap_type') === 'wasteItem', 'scrap_type matches canonical');
    assert(normalizeHeader('Scrap Type') === 'wasteItem', 'Scrap Type matches canonical');

    assert(normalizeHeader('quantityKg') === 'quantityKg', 'quantityKg matches exact canonical');
    assert(normalizeHeader('quantity_kg') === 'quantityKg', 'quantity_kg matches canonical');
    assert(normalizeHeader('QUANTITY KG') === 'quantityKg', 'QUANTITY KG matches canonical');
    assert(normalizeHeader('waste_kg') === 'quantityKg', 'waste_kg matches canonical');
    assert(normalizeHeader('weight_kg') === 'quantityKg', 'weight_kg matches canonical');

    assert(normalizeHeader('Department') === 'department', 'Department matches canonical');
    assert(normalizeHeader('DEPARTMENT') === 'department', 'DEPARTMENT matches canonical');
    assert(normalizeHeader('dept') === 'department', 'dept matches canonical');
    assert(normalizeHeader('department_name') === 'department', 'department_name matches canonical');
    assert(normalizeHeader('Department Name') === 'department', 'Department Name matches canonical');
    assert(normalizeHeader('section') === 'department', 'section matches canonical');
    assert(normalizeHeader('unit') === 'department', 'unit matches canonical');

    assert(normalizeHeader('period') === 'period', 'period matches canonical');
    assert(normalizeHeader('month') === 'period', 'month matches canonical');
    assert(normalizeHeader('date') === 'period', 'date matches canonical');
    assert(normalizeHeader('month_year') === 'period', 'month_year matches canonical');
    assert(normalizeHeader('reporting_period') === 'period', 'reporting_period matches canonical');

    // Unrelated extra columns must NOT map to canonical fields
    assert(normalizeHeader('carbon') === 'carbon', 'carbon column not mapped to canonical');
    assert(normalizeHeader('fuel_litres') === 'fuel_litres', 'fuel_litres column not mapped to canonical');
    assert(normalizeHeader('revenue') === 'revenue', 'revenue column not mapped to canonical');

    console.log('\n--- 2. Text Normalizer Unit Verification ---');
    assert(normalizeDepartmentName('Paint Shop') === 'paint shop', "'Paint Shop' -> 'paint shop'");
    assert(normalizeDepartmentName('PAINT SHOP') === 'paint shop', "'PAINT SHOP' -> 'paint shop'");
    assert(normalizeDepartmentName('paint shop') === 'paint shop', "'paint shop' -> 'paint shop'");
    assert(normalizeDepartmentName('Paint   Shop') === 'paint shop', "'Paint   Shop' -> 'paint shop'");
    assert(normalizeDepartmentName('PAINT-SHOP') === 'paint shop', "'PAINT-SHOP' -> 'paint shop'");
    assert(normalizeDepartmentName('PAINT_SHOP') === 'paint shop', "'PAINT_SHOP' -> 'paint shop'");
    assert(normalizeDepartmentName('  Paint Shop  ') === 'paint shop', "'  Paint Shop  ' -> 'paint shop'");
    assert(normalizeDepartmentName('PaInT ShOp') === 'paint shop', "'PaInT ShOp' -> 'paint shop'");

    console.log('\n--- 3. Waste Classifier Normalization Verification ---');
    assert(classifyWasteItem('USED OIL').valid === true && classifyWasteItem('USED OIL').category === 'hazardous', "USED OIL -> hazardous");
    assert(classifyWasteItem('Used   Oil').valid === true && classifyWasteItem('Used   Oil').category === 'hazardous', "Used   Oil -> hazardous");
    assert(classifyWasteItem('used-oil').valid === true && classifyWasteItem('used-oil').category === 'hazardous', "used-oil -> hazardous");
    assert(classifyWasteItem('Plastic').valid === true && classifyWasteItem('Plastic').category === 'recyclable', "Plastic -> recyclable");
    assert(classifyWasteItem('FOOD WASTE').valid === true && classifyWasteItem('FOOD WASTE').category === 'organic', "FOOD WASTE -> organic");
    assert(classifyWasteItem('Radioactive Sludge').valid === false, "Radioactive Sludge -> rejected");

    // -------------------------------------------------------------
    // INTEGRATION TESTS: Setup Test Companies & Users
    // -------------------------------------------------------------
    console.log('\n--- 4. Setting Up Isolated Test Companies ---');
    const suffix = Date.now().toString().slice(-6);

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Company A
    const compA = await Company.create({
      name: `Test Ingestion Company A ${suffix}`,
      industry: 'Manufacturing',
      employeeCount: 250,
      annualRevenueINR: 50000000,
    });
    const userA = await User.create({
      company: compA._id,
      email: `lead.a.${suffix}@testcorp.com`,
      passwordHash: hashedPassword,
      role: 'facility_manager',
    });

    // Seed initial department for Company A
    const deptA1 = await Department.create({
      companyId: compA._id,
      name: 'Paint Shop',
      normalizedName: 'paint shop',
    });

    // Company B
    const compB = await Company.create({
      name: `Test Ingestion Company B ${suffix}`,
      industry: 'Automotive',
      employeeCount: 400,
      annualRevenueINR: 80000000,
    });
    const userB = await User.create({
      company: compB._id,
      email: `lead.b.${suffix}@testcorp.com`,
      passwordHash: hashedPassword,
      role: 'facility_manager',
    });

    // Login Company A & B
    const loginResA = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { email: userA.email, password: 'Password123!' },
    });
    const cookieA = extractCookie(loginResA.rawSetCookies, 'accessToken');

    const loginResB = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { email: userB.email, password: 'Password123!' },
    });
    const cookieB = extractCookie(loginResB.rawSetCookies, 'accessToken');

    console.log(`  Company A created (ID: ${compA._id})`);
    console.log(`  Company B created (ID: ${compB._id})`);

    // Helper: Upload CSV
    const uploadCsv = async (cookie, csvString, filename = 'test.csv') => {
      const boundary = `----WebKitFormBoundary${Date.now()}`;
      const body =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: text/csv\r\n\r\n` +
        `${csvString}\r\n` +
        `--${boundary}--\r\n`;

      const uploadRes = await request('/api/v1/upload', {
        method: 'POST',
        isMultipart: true,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Cookie: `accessToken=${cookie}`,
        },
        body,
      });

      return uploadRes;
    };

    // -------------------------------------------------------------
    // TEST A: Existing department — normal case ('Paint Shop')
    // -------------------------------------------------------------
    console.log('\n--- Test A: Existing department — normal case ---');
    const csvA = `department,period,kwhUsed\nPaint Shop,2026-01,15000\n`;
    const resA = await uploadCsv(cookieA, csvA, `test_a_${suffix}.csv`);
    assert(resA.status === 202, 'Upload accepted with 202');
    const jobA = await pollJobUntilDone(cookieA, getJobId(resA));
    assert(jobA.status === 'completed', 'Job A completed successfully');

    const recA = await EnergyRecord.findOne({ uploadJobId: jobA._id });
    assert(recA && recA.departmentId.toString() === deptA1._id.toString(), 'Reused existing Paint Shop department ID');

    // -------------------------------------------------------------
    // TEST B: Existing department — uppercase ('PAINT SHOP')
    // -------------------------------------------------------------
    console.log('\n--- Test B: Existing department — uppercase ---');
    const csvB = `department,period,kwhUsed\nPAINT SHOP,2026-02,16000\n`;
    const resB = await uploadCsv(cookieA, csvB, `test_b_${suffix}.csv`);
    const jobB = await pollJobUntilDone(cookieA, getJobId(resB));
    assert(jobB.status === 'completed', 'Job B completed successfully');

    const recB = await EnergyRecord.findOne({ uploadJobId: jobB._id });
    assert(recB && recB.departmentId.toString() === deptA1._id.toString(), 'Uppercase PAINT SHOP reused existing Paint Shop ID');

    // -------------------------------------------------------------
    // TEST C: Existing department — mixed case ('PaInT ShOp')
    // -------------------------------------------------------------
    console.log('\n--- Test C: Existing department — mixed case ---');
    const csvC = `department,period,kwhUsed\nPaInT ShOp,2026-03,17000\n`;
    const resC = await uploadCsv(cookieA, csvC, `test_c_${suffix}.csv`);
    const jobC = await pollJobUntilDone(cookieA, getJobId(resC));
    assert(jobC.status === 'completed', 'Job C completed successfully');

    const recC = await EnergyRecord.findOne({ uploadJobId: jobC._id });
    assert(recC && recC.departmentId.toString() === deptA1._id.toString(), 'Mixed case PaInT ShOp reused existing Paint Shop ID');

    // -------------------------------------------------------------
    // TEST D: Existing department — extra spaces ('  Paint   Shop  ')
    // -------------------------------------------------------------
    console.log('\n--- Test D: Existing department — extra spaces ---');
    const csvD = `department,period,kwhUsed\n"  Paint   Shop  ",2026-04,18000\n`;
    const resD = await uploadCsv(cookieA, csvD, `test_d_${suffix}.csv`);
    const jobD = await pollJobUntilDone(cookieA, getJobId(resD));
    assert(jobD.status === 'completed', 'Job D completed successfully');

    const recD = await EnergyRecord.findOne({ uploadJobId: jobD._id });
    assert(recD && recD.departmentId.toString() === deptA1._id.toString(), 'Spaced department reused existing Paint Shop ID');

    // Verify Company A still has only ONE department so far
    const totalDeptsA = await Department.countDocuments({ companyId: compA._id });
    assert(totalDeptsA === 1, 'Company A still has exactly ONE department in database (no duplicates created)');

    // -------------------------------------------------------------
    // TEST E: New department ('Fabrication')
    // -------------------------------------------------------------
    console.log('\n--- Test E: New department auto-creation ---');
    const csvE = `department,period,kwhUsed\nFabrication,2026-05,22000\n`;
    const resE = await uploadCsv(cookieA, csvE, `test_e_${suffix}.csv`);
    const jobE = await pollJobUntilDone(cookieA, getJobId(resE));
    assert(jobE.status === 'completed', 'Job E completed successfully');

    const fabDept = await Department.findOne({ companyId: compA._id, normalizedName: 'fabrication' });
    assert(Boolean(fabDept), 'New department "fabrication" was auto-created');
    assert(fabDept.normalizedName === 'fabrication', 'Department normalizedName is lowercase "fabrication"');

    // -------------------------------------------------------------
    // TEST F: Same new department repeated in one upload
    // -------------------------------------------------------------
    console.log('\n--- Test F: Same new department repeated with casing variations in one upload ---');
    const csvF =
      `department,period,kwhUsed\n` +
      `Warehouse Logistics,2026-01,5000\n` +
      `WAREHOUSE LOGISTICS,2026-02,5200\n` +
      `warehouse   logistics,2026-03,5100\n` +
      `Warehouse-Logistics,2026-04,5300\n`;
    const resF = await uploadCsv(cookieA, csvF, `test_f_${suffix}.csv`);
    const jobF = await pollJobUntilDone(cookieA, getJobId(resF));
    assert(jobF.status === 'completed', 'Job F completed successfully');

    const warehouseDepts = await Department.find({ companyId: compA._id, normalizedName: 'warehouse logistics' });
    assert(warehouseDepts.length === 1, 'Exactly ONE department created for 4 repeated casing/space variations');

    const warehouseRecords = await EnergyRecord.find({ uploadJobId: jobF._id });
    const distinctDeptsInRecords = new Set(warehouseRecords.map((r) => r.departmentId.toString()));
    assert(distinctDeptsInRecords.size === 1, 'All 4 records point to the exact same department ID');

    // -------------------------------------------------------------
    // TEST G: Same department across different companies
    // -------------------------------------------------------------
    console.log('\n--- Test G: Company Isolation (Same department name across Company A & B) ---');
    const csvG = `department,period,kwhUsed\nPaint Shop,2026-01,9000\n`;
    const resG = await uploadCsv(cookieB, csvG, `test_g_${suffix}.csv`);
    const jobG = await pollJobUntilDone(cookieB, getJobId(resG));
    assert(jobG.status === 'completed', 'Job G completed successfully for Company B');

    const deptB = await Department.findOne({ companyId: compB._id, normalizedName: 'paint shop' });
    assert(Boolean(deptB), 'Company B has its own "paint shop" department');
    assert(deptB._id.toString() !== deptA1._id.toString(), 'Company A and Company B have separate department IDs (Company Isolation enforced)');

    // -------------------------------------------------------------
    // TEST H: Existing department + new waste type
    // -------------------------------------------------------------
    console.log('\n--- Test H: Existing department + new waste type ---');
    const csvH = `department,period,wasteItem,quantityKg\nPaint Shop,2026-05,Used Oil,125\n`;
    const resH = await uploadCsv(cookieA, csvH, `test_h_${suffix}.csv`);
    const jobH = await pollJobUntilDone(cookieA, getJobId(resH));
    assert(jobH.status === 'completed', 'Job H completed successfully');

    const wasteH = await WasteRecord.findOne({ uploadJobId: jobH._id });
    assert(wasteH && wasteH.category === 'hazardous' && wasteH.subcategory === 'used oil', 'Waste classified as hazardous / used oil');
    assert(wasteH && wasteH.departmentId.toString() === deptA1._id.toString(), 'Reused existing Paint Shop department ID');

    // -------------------------------------------------------------
    // TEST I: New department + recognized waste
    // -------------------------------------------------------------
    console.log('\n--- Test I: New department + recognized waste ---');
    const csvI = `department,period,wasteItem,quantityKg\nDie Casting Unit,2026-06,Aluminium,340\n`;
    const resI = await uploadCsv(cookieA, csvI, `test_i_${suffix}.csv`);
    const jobI = await pollJobUntilDone(cookieA, getJobId(resI));
    assert(jobI.status === 'completed', 'Job I completed successfully');

    const castingDept = await Department.findOne({ companyId: compA._id, normalizedName: 'die casting unit' });
    assert(Boolean(castingDept), 'Die Casting Unit department auto-created');

    const wasteI = await WasteRecord.findOne({ uploadJobId: jobI._id });
    assert(wasteI && wasteI.category === 'recyclable' && wasteI.subcategory === 'aluminium', 'Waste classified as recyclable / aluminium');

    // -------------------------------------------------------------
    // TEST J: Waste capitalization variations
    // -------------------------------------------------------------
    console.log('\n--- Test J: Waste capitalization variations ---');
    const csvJ =
      `department,period,wasteItem,quantityKg\n` +
      `Paint Shop,2026-07,USED OIL,50\n` +
      `Paint Shop,2026-07,used oil,60\n` +
      `Paint Shop,2026-07,Used   Oil,70\n`;
    const resJ = await uploadCsv(cookieA, csvJ, `test_j_${suffix}.csv`);
    const jobJ = await pollJobUntilDone(cookieA, getJobId(resJ));
    assert(jobJ.status === 'completed', 'Job J completed successfully');

    const wasteRecordsJ = await WasteRecord.find({ uploadJobId: jobJ._id });
    const allHazardous = wasteRecordsJ.every((r) => r.category === 'hazardous' && r.subcategory === 'used oil');
    assert(allHazardous && wasteRecordsJ.length === 3, 'All 3 capitalization/spacing variants classified identically as hazardous / used oil');

    // -------------------------------------------------------------
    // TEST K: Unknown waste ('Radioactive Sludge' -> reject & zero persistence)
    // -------------------------------------------------------------
    console.log('\n--- Test K: Unknown waste atomicity & zero persistence ---');
    const initialDeptsCount = await Department.countDocuments({ companyId: compA._id });
    const initialWasteCount = await WasteRecord.countDocuments({ companyId: compA._id });

    const csvK =
      `department,period,wasteItem,quantityKg\n` +
      `Brand New Dept,2026-08,Plastic,100\n` +
      `Brand New Dept,2026-08,Radioactive Sludge,500\n`;
    const resK = await uploadCsv(cookieA, csvK, `test_k_${suffix}.csv`);
    const jobK = await pollJobUntilDone(cookieA, getJobId(resK));
    assert(jobK.status === 'failed', 'Job K failed due to unknown waste');
    assert(jobK.errorDetail && jobK.errorDetail.some((e) => e.field === 'wasteItem'), 'Error detail reports unknown wasteItem');

    const finalDeptsCount = await Department.countDocuments({ companyId: compA._id });
    const finalWasteCount = await WasteRecord.countDocuments({ companyId: compA._id });
    assert(finalDeptsCount === initialDeptsCount, 'ZERO new departments created on failed upload (Atomic)');
    assert(finalWasteCount === initialWasteCount, 'ZERO waste records persisted on failed upload (Atomic)');

    // -------------------------------------------------------------
    // TEST L: Header aliases (diverse casing, separators, aliases)
    // -------------------------------------------------------------
    console.log('\n--- Test L: Header Aliases ---');
    const csvL =
      `Department Name,reporting_period,Electricity_KWh\n` +
      `Paint Shop,2026-08,25000\n`;
    const resL = await uploadCsv(cookieA, csvL, `test_l_${suffix}.csv`);
    const jobL = await pollJobUntilDone(cookieA, getJobId(resL));
    assert(jobL.status === 'completed', 'Job L with aliases (Department Name, reporting_period, Electricity_KWh) completed');

    const recL = await EnergyRecord.findOne({ uploadJobId: jobL._id });
    assert(recL && recL.kwhUsed === 25000 && recL.period === '2026-08', 'Header aliases mapped correctly to kwhUsed, period, department');

    const csvL2 =
      `section,month_year,scrap_type,weight_kg\n` +
      `Paint Shop,2026-08,Plastic,180\n`;
    const resL2 = await uploadCsv(cookieA, csvL2, `test_l2_${suffix}.csv`);
    const jobL2 = await pollJobUntilDone(cookieA, getJobId(resL2));
    assert(jobL2.status === 'completed', 'Job L2 with aliases (section, month_year, scrap_type, weight_kg) completed');

    const wasteL2 = await WasteRecord.findOne({ uploadJobId: jobL2._id });
    assert(wasteL2 && wasteL2.quantityKg === 180 && wasteL2.category === 'recyclable', 'Waste aliases mapped correctly');

    // -------------------------------------------------------------
    // TEST M: Negative kWh -> reject
    // -------------------------------------------------------------
    console.log('\n--- Test M: Negative kWh rejection ---');
    const csvM = `department,period,kwhUsed\nPaint Shop,2026-09,-5000\n`;
    const resM = await uploadCsv(cookieA, csvM, `test_m_${suffix}.csv`);
    const jobM = await pollJobUntilDone(cookieA, getJobId(resM));
    assert(jobM.status === 'failed', 'Negative kWh rejected with failed job');
    assert(jobM.errorDetail && jobM.errorDetail.some((e) => e.field === 'kwhUsed'), 'Error detail flags negative kwhUsed');

    // -------------------------------------------------------------
    // TEST N: Negative waste quantity -> reject
    // -------------------------------------------------------------
    console.log('\n--- Test N: Negative waste quantity rejection ---');
    const csvN = `department,period,wasteItem,quantityKg\nPaint Shop,2026-09,Plastic,-45\n`;
    const resN = await uploadCsv(cookieA, csvN, `test_n_${suffix}.csv`);
    const jobN = await pollJobUntilDone(cookieA, getJobId(resN));
    assert(jobN.status === 'failed', 'Negative quantityKg rejected with failed job');
    assert(jobN.errorDetail && jobN.errorDetail.some((e) => e.field === 'quantityKg'), 'Error detail flags negative quantityKg');

    // -------------------------------------------------------------
    // TEST O: Carbon column must NOT override GreenPulse calculated carbon
    // -------------------------------------------------------------
    console.log('\n--- Test O: Carbon column ignored in calculations ---');
    const csvO =
      `department,period,kwhUsed,carbon,co2,emissions\n` +
      `Paint Shop,2026-10,10000,999999,888888,777777\n`;
    const resO = await uploadCsv(cookieA, csvO, `test_o_${suffix}.csv`);
    const jobO = await pollJobUntilDone(cookieA, getJobId(resO));
    assert(jobO.status === 'completed', 'Job O uploaded successfully with extra carbon columns');

    // Give recomputation pipeline a moment to settle
    await new Promise((r) => setTimeout(r, 600));

    const carbonSummaryRes = await request('/api/v1/carbon/summary', {
      headers: { Cookie: `accessToken=${cookieA}` },
    });
    // For 10,000 kWh at 0.82 factor, 2026-10 scope 2 should be 8,200 kg CO2e, NOT 999,999!
    const periodOct = carbonSummaryRes.body.data?.periods?.find((p) => p.period === '2026-10');
    assert(periodOct && periodOct.co2eScope2 === 8200, `Calculated Scope 2 is 8,200 kg (CEA 0.82), NOT user carbon (got: ${periodOct?.co2eScope2})`);
    assert(periodOct && periodOct.scopes.scope1.value === null, 'Scope 1 remains strictly null (unavailable)');

    // -------------------------------------------------------------
    // TEST P: Fuel column must NOT become Scope 1
    // -------------------------------------------------------------
    console.log('\n--- Test P: Fuel column does NOT create Scope 1 ---');
    const csvP =
      `department,period,kwhUsed,fuel_litres,diesel\n` +
      `Paint Shop,2026-11,10000,500,200\n`;
    const resP = await uploadCsv(cookieA, csvP, `test_p_${suffix}.csv`);
    const jobP = await pollJobUntilDone(cookieA, getJobId(resP));
    assert(jobP.status === 'completed', 'Job P uploaded successfully with extra fuel columns');

    await new Promise((r) => setTimeout(r, 600));

    const carbonSummaryRes2 = await request('/api/v1/carbon/summary', {
      headers: { Cookie: `accessToken=${cookieA}` },
    });
    const periodNov = carbonSummaryRes2.body.data?.periods?.find((p) => p.period === '2026-11');
    assert(periodNov && periodNov.scopes.scope1.value === null, 'Scope 1 remains null despite fuel_litres in CSV');
    assert(periodNov && periodNov.scopes.scope1.dataAvailable === false, 'Scope 1 dataAvailable remains false');

    // -------------------------------------------------------------
    // TEST Q: Duplicate upload (Idempotency)
    // -------------------------------------------------------------
    console.log('\n--- Test Q: Idempotent duplicate upload ---');
    const resQ1 = await uploadCsv(cookieA, csvP, `test_p_${suffix}.csv`);
    assert(resQ1.body.meta?.idempotent === true || resQ1.body.data?.isDuplicate === true || resQ1.status === 200, 'Duplicate file upload flagged as idempotent');
    assert(resQ1.body.data?.status === 'completed', 'Returns completed status without re-executing job');

    // -------------------------------------------------------------
    // TEST R: Regression check across summary endpoints
    // -------------------------------------------------------------
    console.log('\n--- Test R: Regression Check ---');
    const greenScoreRes = await request('/api/v1/greenscore', {
      headers: { Cookie: `accessToken=${cookieA}` },
    });
    assert(greenScoreRes.status === 200, 'GET /api/v1/greenscore returns 200');
    assert(typeof greenScoreRes.body.data.score === 'number', 'Green Score is numeric');

    const wasteSummaryRes = await request('/api/v1/waste/summary', {
      headers: { Cookie: `accessToken=${cookieA}` },
    });
    assert(wasteSummaryRes.status === 200, 'GET /api/v1/waste/summary returns 200');
    assert(wasteSummaryRes.body.data.hasData === true, 'Waste summary reports hasData: true');

    const esgRes = await request('/api/v1/esg/score', {
      headers: { Cookie: `accessToken=${cookieA}` },
    });
    assert(esgRes.status === 200, 'GET /api/v1/esg/score returns 200');
    assert(esgRes.body.data.principles.length === 9, 'All 9 ESG principles intact');

    console.log('\n====================================================');
    console.log(`📊 PRE-7E INGESTION TEST SUMMARY`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('====================================================');
  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
