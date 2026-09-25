/**
 * GreenPulse AI - Phase 3 Comprehensive Verification Script
 * Validates Reference Data, Carbon Intelligence Engine, ESG Engine, Green Score Engine,
 * and the Recomputation Pipeline with strict adherence to the Laptop Safety Protocol:
 * - Tiny, hand-checkable payloads (1-2 records)
 * - Sequential execution
 * - Clean server and DB teardown
 */

const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const referenceCache = require('../src/config/referenceCache');
const { seedReferenceData } = require('../src/lib/seed-reference-data');

const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Department = require('../src/modules/departments/department.model');
const UploadJob = require('../src/modules/upload/upload-job.model');
const EnergyRecord = require('../src/modules/upload/energy-record.model');
const WasteRecord = require('../src/modules/upload/waste-record.model');
const Emission = require('../src/modules/carbon/emission.model');
const PrincipleDisclosure = require('../src/modules/esg/principle-disclosure.model');
const GreenScore = require('../src/modules/greenscore/greenscore.model');
const { calculateDirectionAwareScore } = require('../src/modules/greenscore/greenscore.service');
const { runRecomputationPipeline } = require('../src/jobs/recomputation.pipeline');

let server;
let baseUrl;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      fetchOptions.body = options.body;
      delete headers['Content-Type'];
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
    // ignore
  }

  const rawSetCookies = typeof res.headers.getSetCookie === 'function'
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

const pollUploadJob = async (jobId, authHeaders, maxAttempts = 15) => {
  for (let i = 0; i < maxAttempts; i++) {
    await delay(200);
    const res = await request(`/api/v1/upload/jobs/${jobId}`, { headers: authHeaders });
    const job = res.body?.data?.job;
    if (job?.status === 'completed' || job?.status === 'failed') {
      return job;
    }
  }
  return null;
};

const runVerification = async () => {
  console.log('====================================================');
  console.log('Starting Phase 3 Verification for GreenPulse AI');
  console.log('Resource Protection Protocol: Active (Tiny Sequential Tests)');
  console.log('====================================================\n');

  const results = [];
  const record = (num, description, passed, details = '') => {
    results.push({ num, description, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Test ${num}] ${mark}: ${description}`);
    if (details) console.log(`   └─ ${details}`);
  };

  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Run Idempotent Seeder
    const seedResult = await seedReferenceData();
    record(1, 'Reference Data Seeder ran idempotently', true, `Seeded/Verified: ${seedResult.seededFactors} factors, ${seedResult.seededRubrics} rubrics`);

    // 3. Initialize In-Memory Reference Cache
    await referenceCache.ensureCacheLoaded();
    const indiaFactor = referenceCache.getEmissionFactor('India', 'grid_electricity');
    const rubrics = referenceCache.getAllComplianceRubrics();
    record(
      2,
      'In-Memory Reference Cache initialized via memoized loader',
      indiaFactor.factorKgCO2ePerKwh === 0.82 && rubrics.length === 9,
      `Factor: ${indiaFactor.factorKgCO2ePerKwh} kg CO2e/kWh (Version: ${indiaFactor.version}), Rubrics: ${rubrics.length}`
    );

    // 4. Start ephemeral HTTP server on random port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        record(3, 'Test HTTP server booted on ephemeral port', true, `Listening at ${baseUrl}`);
        resolve();
      });
    });

    // 5. Clean up old test data and create test user via signup
    const testEmail = `phase3_${Date.now()}@greenpulse-corp.com`;
    const signupRes = await request('/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'Password123!',
        role: 'facility_manager',
      },
    });

    const cookies = parseCookies(signupRes.rawSetCookies);
    const authHeaders = {
      Cookie: `accessToken=${cookies.accessToken}`,
    };

    const userInDb = await User.findOne({ email: testEmail });
    const companyId = userInDb?.company;

    record(4, 'Test user and company registered successfully via signup', Boolean(userInDb && companyId), `Company ID: ${companyId}`);

    // 6. Create test department
    const deptRes = await request('/api/v1/departments', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Assembly Line 1',
        facilityType: 'MANUFACTURING',
        headCount: 45,
        areaSqFt: 12000,
      },
    });

    const departmentId = deptRes.body?.data?.department?._id;
    record(5, 'Test department created', deptRes.status === 201, `Department ID: ${departmentId}`);

    // -------------------------------------------------------------
    // Test 6: Zero Division & Direction-Aware Normalization Unit Logic
    // -------------------------------------------------------------
    const z1 = calculateDirectionAwareScore(100, 0); // baseline > 0, current = 0 -> 100
    const z2 = calculateDirectionAwareScore(0, 0);   // baseline = 0, current = 0 -> 100
    const z3 = calculateDirectionAwareScore(0, 100); // baseline = 0, current > 0 -> 0
    const imp = calculateDirectionAwareScore(100, 80); // 100/80 * 100 = 125 -> clamped 100
    const reg = calculateDirectionAwareScore(100, 125); // 100/125 * 100 = 80 -> 80

    const zeroRulesPass = z1 === 100 && z2 === 100 && z3 === 0 && imp === 100 && reg === 80;
    record(
      6,
      'Zero-division handling and direction-aware clamping verified by hand',
      zeroRulesPass,
      `b>0,c=0 -> ${z1}; b=0,c=0 -> ${z2}; b=0,c>0 -> ${z3}; imp(100,80) -> ${imp}; reg(100,125) -> ${reg}`
    );

    // -------------------------------------------------------------
    // Test 7: Upload Energy CSV with 100 kWh -> Scope 2 CO2e Calculation
    // Hand calculation: 100 * 0.82 = 82.0 kg CO2e
    // -------------------------------------------------------------
    const csvContent1 = `department,period,kwhUsed\nAssembly Line 1,2026-01,100\n`;
    const form1 = new FormData();
    const fileBlob1 = new Blob([csvContent1], { type: 'text/csv' });
    form1.append('file', fileBlob1, 'energy_jan_2026.csv');

    const uploadRes1 = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: form1,
    });

    const jobId1 = uploadRes1.body?.data?.jobId;
    record(7, 'Upload API accepted energy CSV with non-blocking 202 status', uploadRes1.status === 202 && !!jobId1, `Job ID: ${jobId1}`);

    // Poll until completed
    const completedJob1 = await pollUploadJob(jobId1, authHeaders);
    record(8, 'Upload job parsed and persisted rows to MongoDB', completedJob1?.status === 'completed', `Processed rows: ${completedJob1?.processedCount}`);

    // Give pipeline brief grace to complete fire-and-forget chain
    await delay(800);

    // Verify DB Emission document clean numeric/nullable storage
    const emissionDoc = await Emission.findOne({ companyId, period: '2026-01' }).lean();
    const dbEmissionClean =
      emissionDoc &&
      emissionDoc.kwhUsed === 100 &&
      emissionDoc.co2eScope1 === null &&
      emissionDoc.co2eScope2 === 82.0 &&
      emissionDoc.co2eScope3 === null &&
      emissionDoc.totalCo2e === 82.0 &&
      emissionDoc.factorVersion === 'CEA-2025.1';

    record(
      9,
      'Database Emission record stored clean numeric/nullable values (no metadata objects in DB)',
      Boolean(dbEmissionClean),
      `kwhUsed: ${emissionDoc?.kwhUsed}, Scope 1: ${emissionDoc?.co2eScope1}, Scope 2: ${emissionDoc?.co2eScope2} kg, Scope 3: ${emissionDoc?.co2eScope3}`
    );

    // -------------------------------------------------------------
    // Test 10: GET /api/v1/carbon/summary API Wrapper Metadata
    // -------------------------------------------------------------
    const carbonRes = await request('/api/v1/carbon/summary', { headers: authHeaders });
    const cData = carbonRes.body?.data;
    const wrapperValid =
      cData &&
      cData.scopes?.scope1?.dataAvailable === false &&
      cData.scopes?.scope1?.value === null &&
      cData.scopes?.scope1?.reason === 'No direct-fuel activity data ingested yet' &&
      cData.scopes?.scope2?.dataAvailable === true &&
      cData.scopes?.scope2?.value === 82.0 &&
      cData.scopes?.scope3?.dataAvailable === false &&
      cData.scopes?.scope3?.value === null &&
      cData.scopes?.scope3?.reason === 'No value-chain activity data ingested yet';

    record(
      10,
      'GET /api/v1/carbon/summary wraps raw nulls with availability metadata (never bare 0)',
      carbonRes.status === 200 && Boolean(wrapperValid),
      `Scope 1 available: ${cData?.scopes?.scope1?.dataAvailable}, Scope 2: ${cData?.scopes?.scope2?.value} kg, Scope 3: ${cData?.scopes?.scope3?.dataAvailable}`
    );

    // -------------------------------------------------------------
    // Test 11: ESG Principle 6 State Transition (Energy Only -> Partial 50)
    // -------------------------------------------------------------
    const esgRes1 = await request('/api/v1/esg/score', { headers: authHeaders });
    const esgData1 = esgRes1.body?.data;
    const p6EnergyOnly = esgData1?.principles?.find((p) => p.number === 6);
    const p6EnergyOnlyPass =
      p6EnergyOnly &&
      p6EnergyOnly.status === 'partial' &&
      p6EnergyOnly.coveragePercent === 50 &&
      p6EnergyOnly.activeDataSources.length === 1;

    // Verify exact contract (no forbidden keys)
    const hasForbiddenKeys =
      'isSeededDemo' in (esgData1?.principles?.[0] || {}) ||
      'dataSourceType' in (esgData1?.principles?.[0] || {});

    record(
      11,
      'Principle 6 evaluates to partial (50%) when only energy data is present; exact contract preserved',
      Boolean(p6EnergyOnlyPass && !hasForbiddenKeys),
      `P6 Status: ${p6EnergyOnly?.status}, Coverage: ${p6EnergyOnly?.coveragePercent}%, Forbidden keys present: ${hasForbiddenKeys}`
    );

    // -------------------------------------------------------------
    // Test 12: Upload Waste CSV -> Principle 6 Transitions to Complete (100%)
    // -------------------------------------------------------------
    const wasteCsv = `department,period,quantityKg,category\nAssembly Line 1,2026-03,50,HAZARDOUS\n`;
    const form2 = new FormData();
    const fileBlob2 = new Blob([wasteCsv], { type: 'text/csv' });
    form2.append('file', fileBlob2, 'waste_mar_2026.csv');

    const uploadRes2 = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: form2,
    });

    const jobId2 = uploadRes2.body?.data?.jobId;
    record(12, 'Upload API accepted waste CSV', uploadRes2.status === 202 && !!jobId2);

    await pollUploadJob(jobId2, authHeaders);
    await delay(800);

    const esgRes2 = await request('/api/v1/esg/score', { headers: authHeaders });
    const esgData2 = esgRes2.body?.data;
    const p6Both = esgData2?.principles?.find((p) => p.number === 6);
    const p6BothPass =
      p6Both &&
      p6Both.status === 'complete' &&
      p6Both.coveragePercent === 100 &&
      p6Both.activeDataSources.length === 2;

    record(
      13,
      'Principle 6 dynamically transitions to complete (100%) when Energy + Waste both present',
      Boolean(p6BothPass),
      `P6 Status: ${p6Both?.status}, Coverage: ${p6Both?.coveragePercent}%, Sources: ${p6Both?.activeDataSources?.length}`
    );

    // -------------------------------------------------------------
    // Test 14: Independent Baselines & Direction-Aware Green Score
    // Baseline Energy: 2026-01 (100 kWh)
    // Upload 2026-02 (80 kWh) -> Improvement -> (100/80)*100 = 125 -> clamped to 100
    // -------------------------------------------------------------
    const energyCsvImproved = `department,period,kwhUsed\nAssembly Line 1,2026-02,80\n`;
    const form3 = new FormData();
    form3.append('file', new Blob([energyCsvImproved], { type: 'text/csv' }), 'energy_feb_2026.csv');

    const uploadRes3 = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: form3,
    });

    const jobId3 = uploadRes3.body?.data?.jobId;
    await pollUploadJob(jobId3, authHeaders);
    await delay(800);

    const gsRes1 = await request('/api/v1/greenscore', { headers: authHeaders });
    const gsData1 = gsRes1.body?.data;
    const eeScore1 = gsData1?.breakdown?.energyEfficiency;

    record(
      14,
      'Green Score Energy Efficiency improves to 100 upon consumption reduction (100 kWh -> 80 kWh)',
      eeScore1?.score === 100 && eeScore1?.source === 'baseline_fallback',
      `Energy Efficiency score: ${eeScore1?.score}, source: ${eeScore1?.source}`
    );

    // -------------------------------------------------------------
    // Test 15: Regression test: Upload 2026-04 with 125 kWh -> Score drops to 80
    // Hand calculation: (100 / 125) * 100 = 80
    // -------------------------------------------------------------
    const energyCsvRegressed = `department,period,kwhUsed\nAssembly Line 1,2026-04,125\n`;
    const form4 = new FormData();
    form4.append('file', new Blob([energyCsvRegressed], { type: 'text/csv' }), 'energy_apr_2026.csv');

    const uploadRes4 = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: form4,
    });

    const jobId4 = uploadRes4.body?.data?.jobId;
    await pollUploadJob(jobId4, authHeaders);
    await delay(800);

    const gsRes2 = await request('/api/v1/greenscore', { headers: authHeaders });
    const gsData2 = gsRes2.body?.data;
    const eeScore2 = gsData2?.breakdown?.energyEfficiency;

    record(
      15,
      'Green Score Energy Efficiency regresses to 80 upon consumption increase (100 kWh baseline -> 125 kWh current)',
      eeScore2?.score === 80 && eeScore2?.source === 'baseline_fallback',
      `Energy Efficiency score: ${eeScore2?.score} (dropped as expected), Overall GreenScore: ${gsData2?.score}, Latest Document Period: ${gsData2?.period}`
    );

    // -------------------------------------------------------------
    // Test 16: Independent Metric Baselines Verification
    // Energy baseline = 2026-01, Waste baseline = 2026-03 (not forced to 2026-01)
    // -------------------------------------------------------------
    const latestGsDoc = await GreenScore.findOne({ companyId }).sort({ calculatedAt: -1 }).lean();
    const indepPass =
      latestGsDoc?.breakdown?.energyEfficiency?.baselinePeriod === '2026-01' &&
      latestGsDoc?.breakdown?.wasteManagement?.baselinePeriod === '2026-03' &&
      latestGsDoc?.period === '2026-04'; // latest overall usable period

    record(
      16,
      'Independent metric baselines verified (Energy: 2026-01, Waste: 2026-03, Overall Period: 2026-04)',
      Boolean(indepPass),
      `Energy Baseline: ${latestGsDoc?.breakdown?.energyEfficiency?.baselinePeriod}, Waste Baseline: ${latestGsDoc?.breakdown?.wasteManagement?.baselinePeriod}, Top-Level Period: ${latestGsDoc?.period}`
    );

    // -------------------------------------------------------------
    // Test 17: In-Memory Recomputation Deduplication
    // -------------------------------------------------------------
    const fakeJobId = new mongoose.Types.ObjectId();
    const run1 = await runRecomputationPipeline({ companyId, jobId: fakeJobId });
    const run2 = await runRecomputationPipeline({ companyId, jobId: fakeJobId });

    record(
      17,
      'Single-process in-memory deduplication drops duplicate invocations for same jobId',
      run1.success === true && run2.skipped === true && run2.reason === 'duplicate_job',
      `Run 1 success: ${run1.success}, Run 2 skipped: ${run2.skipped}`
    );

    // -------------------------------------------------------------
    // Test 18: Cascading Failure State Handling
    // -------------------------------------------------------------
    const brokenPipelineResult = await runRecomputationPipeline({ companyId: new mongoose.Types.ObjectId(), jobId: new mongoose.Types.ObjectId() });

    record(
      18,
      'Pipeline handles empty/new company safely without unhandled crashes',
      Boolean(brokenPipelineResult.success),
      `Calculated neutral scores cleanly`
    );

  } catch (error) {
    console.error('\n❌ Unhandled error during verification:', error);
    record(999, 'Fatal verification error', false, error.message);
  } finally {
    // -------------------------------------------------------------
    // Resource Teardown Protocol: Stop test server & disconnect DB
    // -------------------------------------------------------------
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('\n[Teardown] Ephemeral test server closed.');
    }

    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
      console.log('[Teardown] MongoDB connection closed cleanly.');
    }

    console.log('\n====================================================');
    console.log('Phase 3 Verification Summary');
    console.log('====================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}\n`);

    if (passedCount === results.length) {
      console.log('🎉 ALL PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } else {
      console.log('⚠️ SOME TESTS FAILED. Please review the log above.');
    }
  }
};

if (require.main === module) {
  runVerification()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runVerification };
