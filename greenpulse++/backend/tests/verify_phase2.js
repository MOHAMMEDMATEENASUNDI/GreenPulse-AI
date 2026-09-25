/**
 * Phase 2 Comprehensive Verification Script
 * Validates Company Profile, Departments CRUD, CSV/Excel Upload Pipeline,
 * Idempotency, Row Validation, Atomic Rollback, Department Resolution, and Firestore Mirroring.
 */

const http = require('http');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const { db: firestoreDb, isInitialized: isFirebaseInitialized } = require('../src/config/firebase');

const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Department = require('../src/modules/departments/department.model');
const UploadJob = require('../src/modules/upload/upload-job.model');
const EnergyRecord = require('../src/modules/upload/energy-record.model');
const WasteRecord = require('../src/modules/upload/waste-record.model');

let server;
let baseUrl;

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
      // Fetch automatically sets the multipart boundary header
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
    // Non-JSON response
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runVerification = async () => {
  console.log('====================================================');
  console.log('Starting Phase 2 Verification for GreenPulse AI');
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

    // Clean up test data
    const testEmail = `phase2_test_${Date.now()}@greenpulse-corp.com`;
    await User.deleteMany({ email: { $regex: /@greenpulse-corp\.com$/ } });
    await Company.deleteMany({ name: { $regex: /GREENPULSE-CORP/i } });

    // 2. Start HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        record(1, 'Server booted successfully on ephemeral port', true, `Listening at ${baseUrl}`);
        resolve();
      });
    });

    // 3. Unauthenticated access guards
    const unauthCompanyRes = await request('/api/v1/companies/me');
    record(
      2,
      'GET /api/v1/companies/me returns 401 without auth cookie',
      unauthCompanyRes.status === 401 && unauthCompanyRes.body?.error?.code === 'UNAUTHORIZED',
      `Status: ${unauthCompanyRes.status}, code: ${unauthCompanyRes.body?.error?.code}`
    );

    const unauthDeptRes = await request('/api/v1/departments');
    record(
      3,
      'GET /api/v1/departments returns 401 without auth cookie',
      unauthDeptRes.status === 401 && unauthDeptRes.body?.error?.code === 'UNAUTHORIZED',
      `Status: ${unauthDeptRes.status}, code: ${unauthDeptRes.body?.error?.code}`
    );

    const unauthUploadRes = await request('/api/v1/upload', { method: 'POST' });
    record(
      4,
      'POST /api/v1/upload returns 401 without auth cookie',
      unauthUploadRes.status === 401 && unauthUploadRes.body?.error?.code === 'UNAUTHORIZED',
      `Status: ${unauthUploadRes.status}, code: ${unauthUploadRes.body?.error?.code}`
    );

    // 4. Signup flow links Company document automatically
    const signupRes = await request('/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'Password123!',
        role: 'facility_manager',
      },
    });

    const cookies = parseCookies(signupRes.rawSetCookies);
    const accessToken = cookies.accessToken;
    const authHeaders = { Cookie: `accessToken=${accessToken}` };

    const userInDb = await User.findOne({ email: testEmail });
    const hasCompanyLinked = !!userInDb?.company;
    let companyDoc = null;
    if (hasCompanyLinked) {
      companyDoc = await Company.findById(userInDb.company);
    }

    record(
      5,
      'Signup automatically creates & links a Company document to User',
      signupRes.status === 201 && hasCompanyLinked && !!companyDoc,
      `User company ID: ${userInDb?.company}, Company name: ${companyDoc?.name}`
    );

    // 5. GET /api/v1/companies/me
    const getCompanyRes = await request('/api/v1/companies/me', { headers: authHeaders });
    record(
      6,
      'GET /api/v1/companies/me returns linked company profile',
      getCompanyRes.status === 200 && getCompanyRes.body?.data?.company?._id === companyDoc._id.toString(),
      `Returned Company: ${getCompanyRes.body?.data?.company?.name}`
    );

    // 6. PATCH /api/v1/companies/me
    const patchCompanyRes = await request('/api/v1/companies/me', {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        name: 'GreenPulse Global Industries',
        industry: 'Renewable Manufacturing',
        brsrStatus: 'mandatory',
      },
    });

    const updatedCompany = patchCompanyRes.body?.data?.company;
    record(
      7,
      'PATCH /api/v1/companies/me successfully updates company profile',
      patchCompanyRes.status === 200 &&
        updatedCompany?.name === 'GreenPulse Global Industries' &&
        updatedCompany?.brsrStatus === 'mandatory',
      `Updated name: ${updatedCompany?.name}, status: ${updatedCompany?.brsrStatus}`
    );

    // 7. POST /api/v1/departments (Create Department)
    const createDeptRes1 = await request('/api/v1/departments', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Press & Stamping Shop',
        type: 'operations',
      },
    });

    const createDeptRes2 = await request('/api/v1/departments', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Paint & Coating Facility',
        type: 'production',
      },
    });

    const dept1 = createDeptRes1.body?.data?.department;
    const dept2 = createDeptRes2.body?.data?.department;

    record(
      8,
      'POST /api/v1/departments creates new departments scoped to company',
      createDeptRes1.status === 201 && createDeptRes2.status === 201 && !!dept1?._id && !!dept2?._id,
      `Created: '${dept1?.name}' (ID: ${dept1?._id}) and '${dept2?.name}' (ID: ${dept2?._id})`
    );

    // 8. GET /api/v1/departments
    const getDeptsRes = await request('/api/v1/departments', { headers: authHeaders });
    const returnedDepts = getDeptsRes.body?.data?.departments || [];
    record(
      9,
      'GET /api/v1/departments lists all company departments',
      getDeptsRes.status === 200 && returnedDepts.length === 2,
      `Found ${returnedDepts.length} departments for company ${companyDoc._id}`
    );

    // 9. PATCH /api/v1/departments/:id
    const patchDeptRes = await request(`/api/v1/departments/${dept1._id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        name: 'Advanced Press Shop',
      },
    });
    record(
      10,
      'PATCH /api/v1/departments/:id updates department details',
      patchDeptRes.status === 200 && patchDeptRes.body?.data?.department?.name === 'Advanced Press Shop',
      `Updated name: ${patchDeptRes.body?.data?.department?.name}`
    );

    // 10. Valid CSV Upload
    const validCsvContent = `Department,Period,kWh Used\nAdvanced Press Shop,2026-07,14500\nPaint & Coating Facility,2026-07,23200\n`;
    const form1 = new FormData();
    form1.append('file', new Blob([validCsvContent], { type: 'text/csv' }), 'energy_july_2026.csv');
    form1.append('type', 'energy');

    const uploadRes1 = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: form1,
    });

    const jobId1 = uploadRes1.body?.data?.jobId;
    record(
      11,
      'POST /api/v1/upload accepts valid CSV and returns 202 queued immediately',
      uploadRes1.status === 202 && uploadRes1.body?.data?.status === 'queued' && !!jobId1,
      `HTTP status: ${uploadRes1.status}, jobId: ${jobId1}`
    );

    // Wait for background job to finish processing
    let pollJob1 = null;
    for (let attempts = 0; attempts < 15; attempts++) {
      await delay(200);
      const pollRes = await request(`/api/v1/upload/jobs/${jobId1}`, { headers: authHeaders });
      pollJob1 = pollRes.body?.data?.job;
      if (pollJob1?.status === 'completed' || pollJob1?.status === 'failed') {
        break;
      }
    }

    const energyRecords1 = await EnergyRecord.find({ uploadJobId: jobId1 });
    record(
      12,
      'Upload job completes successfully and raw records are persisted in MongoDB',
      pollJob1?.status === 'completed' && energyRecords1.length === 2,
      `Job status: ${pollJob1?.status}, records inserted: ${energyRecords1.length}`
    );

    // 11. Idempotency Check: Uploading exact same file again
    const formDuplicate = new FormData();
    formDuplicate.append('file', new Blob([validCsvContent], { type: 'text/csv' }), 'energy_july_2026.csv');
    formDuplicate.append('type', 'energy');

    const duplicateRes = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formDuplicate,
    });

    const totalEnergyRecords = await EnergyRecord.countDocuments({ companyId: companyDoc._id });
    record(
      13,
      'Uploading duplicate file short-circuits via content hash (idempotency)',
      (duplicateRes.status === 200 || duplicateRes.status === 202) &&
        duplicateRes.body?.meta?.idempotent === true &&
        totalEnergyRecords === 2,
      `Idempotent: ${duplicateRes.body?.meta?.idempotent}, DB total records still: ${totalEnergyRecords}`
    );

    // 12. Row validation: CSV with negative energy value
    const invalidValueCsv = `Department,Period,kWh Used\nAdvanced Press Shop,2026-07,-500\n`;
    const formInvalidVal = new FormData();
    formInvalidVal.append('file', new Blob([invalidValueCsv], { type: 'text/csv' }), 'invalid_energy.csv');
    formInvalidVal.append('type', 'energy');

    const uploadResInvalid = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formInvalidVal,
    });

    const invalidJobId = uploadResInvalid.body?.data?.jobId;
    let pollJobInvalid = null;
    for (let attempts = 0; attempts < 15; attempts++) {
      await delay(200);
      const pollRes = await request(`/api/v1/upload/jobs/${invalidJobId}`, { headers: authHeaders });
      pollJobInvalid = pollRes.body?.data?.job;
      if (pollJobInvalid?.status === 'completed' || pollJobInvalid?.status === 'failed') {
        break;
      }
    }

    const invalidEnergyRecords = await EnergyRecord.find({ uploadJobId: invalidJobId });
    const hasFieldValidationError = pollJobInvalid?.errorDetail?.some(
      (e) => e.row === 1 && (e.field === 'kwhUsed' || e.field.includes('kwh'))
    );

    record(
      14,
      'Invalid row values (e.g. negative energy) cause job failure with row-level error detail and zero persistence',
      pollJobInvalid?.status === 'failed' && hasFieldValidationError && invalidEnergyRecords.length === 0,
      `Job status: ${pollJobInvalid?.status}, errors: ${JSON.stringify(pollJobInvalid?.errorDetail)}`
    );

    // 13. Department resolution: CSV referencing non-existent department
    const unknownDeptCsv = `Department,Period,kWh Used\nGhost Nonexistent Department,2026-07,8800\n`;
    const formUnknownDept = new FormData();
    formUnknownDept.append('file', new Blob([unknownDeptCsv], { type: 'text/csv' }), 'unknown_dept.csv');
    formUnknownDept.append('type', 'energy');

    const uploadResUnknown = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formUnknownDept,
    });

    const unknownJobId = uploadResUnknown.body?.data?.jobId;
    let pollJobUnknown = null;
    for (let attempts = 0; attempts < 15; attempts++) {
      await delay(200);
      const pollRes = await request(`/api/v1/upload/jobs/${unknownJobId}`, { headers: authHeaders });
      pollJobUnknown = pollRes.body?.data?.job;
      if (pollJobUnknown?.status === 'completed' || pollJobUnknown?.status === 'failed') {
        break;
      }
    }

    const ghostDeptInDb = await Department.findOne({
      companyId: companyDoc._id,
      name: /Ghost Nonexistent Department/i,
    });
    const unknownEnergyRecords = await EnergyRecord.find({ uploadJobId: unknownJobId });
    const hasDeptNotFoundError = pollJobUnknown?.errorDetail?.some(
      (e) => e.row === 1 && e.field === 'department' && e.message.includes('Department not found')
    );

    record(
      15,
      'Unmatched department fails job, does NOT implicitly create department, and persists zero records',
      pollJobUnknown?.status === 'failed' &&
        hasDeptNotFoundError &&
        !ghostDeptInDb &&
        unknownEnergyRecords.length === 0,
      `Error: ${JSON.stringify(pollJobUnknown?.errorDetail)}, Ghost department created: ${!!ghostDeptInDb}`
    );

    // 14. Excel (.xlsx) upload
    const wb = xlsx.utils.book_new();
    const wsData = [
      ['Department', 'Period', 'kWh Used'],
      ['Advanced Press Shop', '2026-08', 19800],
      ['Paint & Coating Facility', '2026-08', 27400],
    ];
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    xlsx.utils.book_append_sheet(wb, ws, 'Energy');
    const xlsxBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const formXlsx = new FormData();
    formXlsx.append(
      'file',
      new Blob([xlsxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      'august_energy.xlsx'
    );
    formXlsx.append('type', 'energy');

    const uploadResXlsx = await request('/api/v1/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formXlsx,
    });

    const xlsxJobId = uploadResXlsx.body?.data?.jobId;
    let pollJobXlsx = null;
    for (let attempts = 0; attempts < 15; attempts++) {
      await delay(200);
      const pollRes = await request(`/api/v1/upload/jobs/${xlsxJobId}`, { headers: authHeaders });
      pollJobXlsx = pollRes.body?.data?.job;
      if (pollJobXlsx?.status === 'completed' || pollJobXlsx?.status === 'failed') {
        break;
      }
    }

    const xlsxEnergyRecords = await EnergyRecord.find({ uploadJobId: xlsxJobId });
    record(
      16,
      'Excel (.xlsx) file parses and ingests valid records into MongoDB',
      pollJobXlsx?.status === 'completed' && xlsxEnergyRecords.length === 2,
      `Status: ${pollJobXlsx?.status}, records inserted: ${xlsxEnergyRecords.length}`
    );

    // 15. Real Firestore Verification (Correction 3)
    // "The automated Phase 2 verification must actually read/check the Firestore document and confirm that the expected status was written.
    // If Firestore configuration is missing or unavailable:
    // - Do NOT silently mock success.
    // - Do NOT mark the Firestore test as passed.
    // - Report the actual failure clearly.
    // - Do NOT weaken the implementation just to make the test pass."
    console.log('\n--- Verifying Real Firestore Job Mirroring ---');
    if (!firestoreDb || !isFirebaseInitialized()) {
      record(
        17,
        'Firestore job mirroring: Document read from Firebase Admin',
        false,
        'FAILED: Real Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not configured in backend/.env. Firestore jobs/{jobId} document cannot be verified without real credentials.'
      );
    } else {
      try {
        const docRef = firestoreDb.collection('jobs').doc(jobId1.toString());
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          record(
            17,
            'Firestore job mirroring: Document read from Firebase Admin',
            false,
            `FAILED: Document jobs/${jobId1} does not exist in Firestore.`
          );
        } else {
          const firestoreData = docSnap.data();
          const matchesStatus = firestoreData.status === 'completed';
          record(
            17,
            'Firestore job mirroring: Document read from Firebase Admin',
            matchesStatus,
            `Document jobs/${jobId1} verified in Firestore with status: '${firestoreData.status}'`
          );
        }
      } catch (err) {
        record(
          17,
          'Firestore job mirroring: Document read from Firebase Admin',
          false,
          `FAILED: Exception reading Firestore document: ${err.message}`
        );
      }
    }

    // Print summary
    console.log('\n====================================================');
    console.log('Phase 2 Verification Summary');
    console.log('====================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Results: ${passedCount} / ${totalCount} passed\n`);

    return results;
  } catch (error) {
    console.error('Fatal error during Phase 2 verification:', error);
    throw error;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

if (require.main === module) {
  runVerification()
    .then((results) => {
      const allPassed = results.every((r) => r.passed);
      process.exit(allPassed ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = runVerification;
