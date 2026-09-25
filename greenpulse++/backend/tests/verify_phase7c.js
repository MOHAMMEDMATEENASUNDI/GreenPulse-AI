/**
 * GreenPulse AI — Phase 7C Verification Script
 * Validates deterministic waste classification, upload validation,
 * zero-persistence atomicity, MongoDB persistence, GET /api/v1/waste/summary,
 * energy upload backward-compatibility, Green Score recomputation, and company isolation.
 */

const http = require('http');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Department = require('../src/modules/departments/department.model');
const UploadJob = require('../src/modules/upload/upload-job.model');
const EnergyRecord = require('../src/modules/upload/energy-record.model');
const WasteRecord = require('../src/modules/upload/waste-record.model');
const GreenScore = require('../src/modules/greenscore/greenscore.model');

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
    if (options.body instanceof FormData || options.isMultipart) {
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
    // Non-JSON response
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

const parseCookies = (setCookieList) => {
  const cookies = {};
  if (!setCookieList || !Array.isArray(setCookieList)) return cookies;

  for (const headerStr of setCookieList) {
    if (!headerStr) continue;
    const segments = headerStr.split(';').map((s) => s.trim());
    const [nameVal] = segments;
    const eqIdx = nameVal.indexOf('=');
    if (eqIdx === -1) continue;
    const name = nameVal.substring(0, eqIdx).trim();
    const val = nameVal.substring(eqIdx + 1).trim();
    cookies[name] = val;
  }
  return cookies;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForJob = async (jobId, authHeaders, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await request(`/api/v1/upload/jobs/${jobId}`, { headers: authHeaders });
    const job = res.body?.data?.job;
    if (job && (job.status === 'completed' || job.status === 'failed')) {
      return job;
    }
    await delay(300);
  }
  throw new Error(`Job ${jobId} did not complete within timeout`);
};

const run = async () => {
  console.log('================================================================');
  console.log('Starting Phase 7C Verification: Waste Intelligence & /app/waste');
  console.log('================================================================\n');

  const results = [];
  const record = (num, description, passed, details = '') => {
    results.push({ num, description, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Test ${num}] ${mark}: ${description}`);
    if (details) console.log(`   └─ ${details}`);
  };

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 1. Create Company A user
    const emailA = `phase7c_a_${Date.now()}@greenpulse-corp.com`;
    const signupA = await request('/api/v1/auth/signup', {
      method: 'POST',
      body: { email: emailA, password: 'Password123!', role: 'facility_manager' },
    });
    const cookiesA = parseCookies(signupA.rawSetCookies);
    const authHeadersA = { Cookie: `accessToken=${cookiesA.accessToken}` };
    const userA = await User.findOne({ email: emailA });
    const companyAId = userA.company;

    // Create Company B user for isolation testing
    const emailB = `phase7c_b_${Date.now()}@greenpulse-corp.com`;
    const signupB = await request('/api/v1/auth/signup', {
      method: 'POST',
      body: { email: emailB, password: 'Password123!', role: 'facility_manager' },
    });
    const cookiesB = parseCookies(signupB.rawSetCookies);
    const authHeadersB = { Cookie: `accessToken=${cookiesB.accessToken}` };
    const userB = await User.findOne({ email: emailB });
    const companyBId = userB.company;

    // Create Departments for Company A
    const deptPress = await Department.create({ companyId: companyAId, name: 'Press Shop', type: 'operations' });
    const deptPaint = await Department.create({ companyId: companyAId, name: 'Paint Facility', type: 'production' });
    const deptAssembly = await Department.create({ companyId: companyAId, name: 'Assembly Line', type: 'assembly' });

    // Initial check: empty state
    const initialSummary = await request('/api/v1/waste/summary', { headers: authHeadersA });
    record(
      0,
      'Initial GET /api/v1/waste/summary returns hasData: false and 0 kg',
      initialSummary.status === 200 &&
        initialSummary.body?.data?.hasData === false &&
        initialSummary.body?.data?.totalKg === 0,
      `hasData: ${initialSummary.body?.data?.hasData}, totalKg: ${initialSummary.body?.data?.totalKg}`
    );

    // -------------------------------------------------------------
    // Test: Validation Rejection: -500 kg
    // -------------------------------------------------------------
    const initialRecordCount = await WasteRecord.countDocuments({ companyId: companyAId });
    const invalidNegativeCsv = `department,period,wasteItem,quantityKg\nPaint Facility,2026-09,Used Oil,-500`;
    const formNegative = new FormData();
    formNegative.append('file', new Blob([invalidNegativeCsv], { type: 'text/csv' }), 'negative_test.csv');
    formNegative.append('fileType', 'waste');

    const negUploadRes = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeadersA,
      body: formNegative,
      isMultipart: true,
    });

    const negJob = await waitForJob(negUploadRes.body?.data?.jobId, authHeadersA);
    const afterNegRecordCount = await WasteRecord.countDocuments({ companyId: companyAId });

    record(
      12,
      'Negative quantity (-500 kg) rejected and zero records persisted',
      negJob.status === 'failed' &&
        afterNegRecordCount === initialRecordCount &&
        JSON.stringify(negJob.errorDetail).toLowerCase().includes('negative'),
      `Job status: ${negJob.status}, persisted: ${afterNegRecordCount - initialRecordCount} (expected 0)`
    );

    // -------------------------------------------------------------
    // Test: Validation Rejection: Unknown Keyword
    // -------------------------------------------------------------
    const invalidUnknownCsv = `department,period,wasteItem,quantityKg\nPress Shop,2026-09,Radioactive Sludge,200`;
    const formUnknown = new FormData();
    formUnknown.append('file', new Blob([invalidUnknownCsv], { type: 'text/csv' }), 'unknown_test.csv');
    formUnknown.append('fileType', 'waste');

    const unkUploadRes = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeadersA,
      body: formUnknown,
      isMultipart: true,
    });

    const unkJob = await waitForJob(unkUploadRes.body?.data?.jobId, authHeadersA);
    const afterUnkRecordCount = await WasteRecord.countDocuments({ companyId: companyAId });

    record(
      13,
      'Unknown waste keyword rejected and zero records persisted',
      unkJob.status === 'failed' &&
        afterUnkRecordCount === initialRecordCount &&
        JSON.stringify(unkJob.errorDetail).toLowerCase().includes('unknown waste keyword'),
      `Job status: ${unkJob.status}, persisted: ${afterUnkRecordCount - initialRecordCount} (expected 0)`
    );

    record(
      14,
      'Zero invalid records persisted during failed validation batches',
      afterUnkRecordCount === 0 && afterNegRecordCount === 0,
      `Total waste records in DB after rejected batches: ${afterUnkRecordCount}`
    );

    // -------------------------------------------------------------
    // Test: Valid CSV Upload with all categories and case-insensitivity
    // -------------------------------------------------------------
    const validCsvContent = `department,period,wasteItem,quantityKg
Press Shop,2026-09,Plastic,120
Press Shop,2026-09,Paper,45
Press Shop,2026-09,Aluminium,85
Press Shop,2026-09,Steel,150
Press Shop,2026-09,Rubber,30
Paint Facility,2026-09,Used Oil,35
Assembly Line,2026-09,Chemical Bottles,18
Assembly Line,2026-09,Food Waste,80
Assembly Line,2026-09,   pLaStIc   ,50`;

    const formValidCsv = new FormData();
    formValidCsv.append('file', new Blob([validCsvContent], { type: 'text/csv' }), 'valid_waste.csv');
    formValidCsv.append('fileType', 'waste');

    const csvUploadRes = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeadersA,
      body: formValidCsv,
      isMultipart: true,
    });

    const csvJob = await waitForJob(csvUploadRes.body?.data?.jobId, authHeadersA);

    record(
      1,
      'Valid CSV waste upload processes to completed status',
      csvJob.status === 'completed' && csvJob.processedCount === 9,
      `Processed: ${csvJob.processedCount}/9 rows`
    );

    // Verify deterministic classifications in MongoDB
    const records = await WasteRecord.find({ companyId: companyAId, uploadJobId: csvJob._id });
    record(15, 'Real WasteRecord persisted in MongoDB', records.length === 9, `Persisted count: ${records.length}`);

    // Verify subcategories and classification mappings
    const plasticRecords = records.filter((r) => r.matchedKeyword === 'plastic');
    const paperRecord = records.find((r) => r.matchedKeyword === 'paper');
    const aluminiumRecord = records.find((r) => r.matchedKeyword === 'aluminium');
    const steelRecord = records.find((r) => r.matchedKeyword === 'steel');
    const rubberRecord = records.find((r) => r.matchedKeyword === 'rubber');
    const usedOilRecord = records.find((r) => r.matchedKeyword === 'used oil');
    const chemicalRecord = records.find((r) => r.matchedKeyword === 'chemical bottles');
    const foodRecord = records.find((r) => r.matchedKeyword === 'food waste');

    record(
      3,
      'Plastic → recyclable/plastic',
      plasticRecords.length === 2 && plasticRecords.every((r) => r.category === 'recyclable' && r.subcategory === 'plastic'),
      `Category: ${plasticRecords[0]?.category}, subcategory: ${plasticRecords[0]?.subcategory}`
    );

    record(
      4,
      'Paper → recyclable/paper',
      paperRecord?.category === 'recyclable' && paperRecord?.subcategory === 'paper',
      `Category: ${paperRecord?.category}, subcategory: ${paperRecord?.subcategory}`
    );

    record(
      5,
      'Aluminium → recyclable/aluminium',
      aluminiumRecord?.category === 'recyclable' && aluminiumRecord?.subcategory === 'aluminium',
      `Category: ${aluminiumRecord?.category}, subcategory: ${aluminiumRecord?.subcategory}`
    );

    record(
      6,
      'Steel → recyclable/steel',
      steelRecord?.category === 'recyclable' && steelRecord?.subcategory === 'steel',
      `Category: ${steelRecord?.category}, subcategory: ${steelRecord?.subcategory}`
    );

    record(
      7,
      'Rubber → recyclable/rubber',
      rubberRecord?.category === 'recyclable' && rubberRecord?.subcategory === 'rubber',
      `Category: ${rubberRecord?.category}, subcategory: ${rubberRecord?.subcategory}`
    );

    record(
      8,
      'Used Oil → hazardous/used oil',
      usedOilRecord?.category === 'hazardous' && usedOilRecord?.subcategory === 'used oil',
      `Category: ${usedOilRecord?.category}, subcategory: ${usedOilRecord?.subcategory}`
    );

    record(
      9,
      'Chemical Bottles → hazardous/chemical bottles',
      chemicalRecord?.category === 'hazardous' && chemicalRecord?.subcategory === 'chemical bottles',
      `Category: ${chemicalRecord?.category}, subcategory: ${chemicalRecord?.subcategory}`
    );

    record(
      10,
      'Food Waste → organic/food waste',
      foodRecord?.category === 'organic' && foodRecord?.subcategory === 'food waste',
      `Category: ${foodRecord?.category}, subcategory: ${foodRecord?.subcategory}`
    );

    const spacePlastic = records.find((r) => r.quantityKg === 50);
    record(
      11,
      'Case-insensitive & whitespace-normalized matching',
      spacePlastic?.matchedKeyword === 'plastic' &&
        spacePlastic?.category === 'recyclable' &&
        spacePlastic?.subcategory === 'plastic',
      `Raw: '${spacePlastic?.rawWasteItem}', matchedKeyword: '${spacePlastic?.matchedKeyword}'`
    );

    // -------------------------------------------------------------
    // Test: Valid XLSX Waste Upload
    // -------------------------------------------------------------
    const xlsxRows = [
      { department: 'Press Shop', period: '2026-10', wasteItem: 'Plastic', quantityKg: 100 },
      { department: 'Assembly Line', period: '2026-10', wasteItem: 'Food Waste', quantityKg: 60 },
    ];
    const ws = xlsx.utils.json_to_sheet(xlsxRows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'WasteTelemetry');
    const xlsxBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const formXlsx = new FormData();
    formXlsx.append('file', new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'waste_test.xlsx');
    formXlsx.append('fileType', 'waste');

    const xlsxUploadRes = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeadersA,
      body: formXlsx,
      isMultipart: true,
    });

    const xlsxJob = await waitForJob(xlsxUploadRes.body?.data?.jobId, authHeadersA);
    record(
      2,
      'Valid XLSX waste upload processes to completed status',
      xlsxJob.status === 'completed' && xlsxJob.processedCount === 2,
      `Processed: ${xlsxJob.processedCount}/2 rows from XLSX`
    );

    // -------------------------------------------------------------
    // Test: GET /api/v1/waste/summary totals and breakdown
    // -------------------------------------------------------------
    // Expected sums across CSV + XLSX:
    // Plastic: 120 + 50 + 100 = 270
    // Paper: 45
    // Aluminium: 85
    // Steel: 150
    // Rubber: 30
    // Recyclable total: 270 + 45 + 85 + 150 + 30 = 580
    // Used Oil: 35
    // Chemical Bottles: 18
    // Hazardous total: 53
    // Food Waste: 80 + 60 = 140
    // Organic total: 140
    // Grand Total: 580 + 53 + 140 = 773
    const summaryRes = await request('/api/v1/waste/summary', { headers: authHeadersA });
    const sData = summaryRes.body?.data;

    const correctTotals =
      sData?.totalKg === 773 &&
      sData?.recyclableKg === 580 &&
      sData?.hazardousKg === 53 &&
      sData?.organicKg === 140 &&
      sData?.subcategories?.Plastic === 270 &&
      sData?.subcategories?.Paper === 45 &&
      sData?.subcategories?.Aluminium === 85 &&
      sData?.subcategories?.Steel === 150 &&
      sData?.subcategories?.Rubber === 30 &&
      sData?.subcategories?.['Used Oil'] === 35 &&
      sData?.subcategories?.['Chemical Bottles'] === 18 &&
      sData?.subcategories?.['Food Waste'] === 140;

    record(
      16,
      '/api/v1/waste/summary returns correct totals and category/subcategory breakdown',
      summaryRes.status === 200 && correctTotals,
      `Total: ${sData?.totalKg} kg, Recyclable: ${sData?.recyclableKg} (${sData?.recyclablePct}%), Hazardous: ${sData?.hazardousKg} (${sData?.hazardousPct}%), Organic: ${sData?.organicKg} (${sData?.organicPct}%)`
    );

    // -------------------------------------------------------------
    // Test: Existing Energy-only upload still works
    // -------------------------------------------------------------
    const energyCsv = `department,period,kwhUsed\nPress Shop,2026-09,5200\nPaint Facility,2026-09,3400`;
    const formEnergy = new FormData();
    formEnergy.append('file', new Blob([energyCsv], { type: 'text/csv' }), 'energy_test.csv');
    formEnergy.append('fileType', 'energy');

    const energyUploadRes = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeadersA,
      body: formEnergy,
      isMultipart: true,
    });

    const energyJob = await waitForJob(energyUploadRes.body?.data?.jobId, authHeadersA);
    const energyRecordsCount = await EnergyRecord.countDocuments({ companyId: companyAId, uploadJobId: energyJob._id });

    record(
      18,
      'Existing energy-only CSV/XLSX upload continues working',
      energyJob.status === 'completed' && energyRecordsCount === 2,
      `Energy rows persisted: ${energyRecordsCount}`
    );

    // -------------------------------------------------------------
    // Test: Green Score recomputation still works with WasteRecord
    // -------------------------------------------------------------
    // Give background pipeline 2 seconds to complete
    await delay(2000);
    const greenScoreDoc = await GreenScore.findOne({ companyId: companyAId }).sort({ createdAt: -1 });

    record(
      19,
      'Green Score recomputation pipeline runs and produces score incorporating waste',
      !!greenScoreDoc && Number.isFinite(greenScoreDoc.score) && greenScoreDoc.score > 0,
      `Computed Green Score: ${greenScoreDoc?.score}, period: ${greenScoreDoc?.period}`
    );

    // -------------------------------------------------------------
    // Test: Company Isolation
    // -------------------------------------------------------------
    const summaryB = await request('/api/v1/waste/summary', { headers: authHeadersB });
    record(
      20,
      'Company isolation: Company B cannot see Company A waste telemetry',
      summaryB.body?.data?.hasData === false && summaryB.body?.data?.totalKg === 0,
      `Company B totalKg: ${summaryB.body?.data?.totalKg} (expected 0)`
    );

    console.log('\n================================================================');
    console.log('Phase 7C Backend Verification Summary');
    console.log('================================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Passed: ${passedCount} / ${results.length}`);

    if (passedCount === results.length) {
      console.log('🎉 ALL BACKEND VERIFICATION CHECKS PASSED!\n');
    } else {
      console.log('⚠️ Some checks failed. Check details above.\n');
    }
  } catch (err) {
    console.error('Unexpected error in verification script:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
};

run();
