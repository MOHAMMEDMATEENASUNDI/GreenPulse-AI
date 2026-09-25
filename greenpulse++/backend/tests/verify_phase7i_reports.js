/**
 * GreenPulse AI — Phase 7I Reports Integration Verification Test
 * Verifies:
 * 1. GET /api/v1/reports returns real company reports
 * 2. Reports contain real reportType, period, status, disclosureGapCount, executiveSummary
 * 3. Status is strictly 'generating' | 'ready' | 'needs_review' | 'failed' (never 'completed')
 * 4. GET /api/v1/reports/:id returns clean detail with snapshotSummary
 * 5. GET /api/v1/reports/:id/download returns valid signed download access
 * 6. POST /api/v1/reports initiates report compilation (HTTP 202 Accepted)
 * 7. Company isolation: Company B cannot read or download Company A reports
 * 8. Error handling for non-existent reports (404 NOT_FOUND)
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Report = require('../src/modules/reports/report.model');
const reportService = require('../src/modules/reports/report.service');
const { AuditLog } = require('../src/modules/audit/audit-log.model');

const baseUrl = 'http://localhost:5001/api/v1';

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const fetchOptions = {
    method: options.method || 'GET',
    headers: { ...(options.headers || {}) },
  };

  if (options.body) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let body = {};
  try {
    body = await res.json();
  } catch (e) {
    body = await res.text();
  }

  return { status: res.status, headers: res.headers, body };
};

const runTests = async () => {
  console.log('====================================================');
  console.log('📑 GREENPULSE AI — PHASE 7I REPORTS VERIFICATION');
  console.log('====================================================\n');

  await mongoose.connect(env.MONGO_URI);

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${testName}`);
      if (details) console.log(`     └─ ${details}`);
    } else {
      failed++;
      console.log(`  ❌ FAIL: ${testName}`);
      if (details) console.log(`     └─ ${details}`);
    }
  };

  try {
    // 1. Setup Company A and User A
    const compA = await Company.create({
      name: 'Test Reports Corp A ' + Date.now(),
      industry: 'Manufacturing',
      country: 'India',
      brsrStatus: 'MANDATORY',
    });

    const userA = await User.create({
      name: 'Auditor A',
      email: `reports.test.a.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u',
      role: 'auditor',
      company: compA._id,
    });

    const tokenA = jwt.sign(
      { id: userA._id.toString(), company: compA._id.toString(), role: userA.role, email: userA.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersA = { Authorization: `Bearer ${tokenA}` };

    // Setup Company B and User B for isolation testing
    const compB = await Company.create({
      name: 'Test Reports Corp B ' + Date.now(),
      industry: 'Automotive',
      country: 'India',
    });

    const userB = await User.create({
      name: 'Auditor B',
      email: `reports.test.b.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u',
      role: 'auditor',
      company: compB._id,
    });

    const tokenB = jwt.sign(
      { id: userB._id.toString(), company: compB._id.toString(), role: userB.role, email: userB.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    // 2. Initial state: verify empty reports list for new Company A
    console.log('--- 1. Initial State & Empty Report List Verification ---');
    const initRes = await request('/reports', { headers: authHeadersA });
    assert(initRes.status === 200, 'GET /reports returns 200 for new company');
    assert(Array.isArray(initRes.body.data), 'Returns reports array');
    assert(initRes.body.data.length === 0, 'Initial reports array is empty');

    // 3. Initiate real report compilation via POST /api/v1/reports
    console.log('\n--- 2. Report Compilation Initiation (POST /api/v1/reports) ---');
    const genRes = await request('/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: {
        reportType: 'SEBI_BRSR',
        period: '2026-08',
      },
    });
    assert(genRes.status === 202, 'POST /reports returns HTTP 202 Accepted');
    assert(genRes.body.data.status === 'generating', 'Initial status is strictly "generating"');
    const reportIdA = genRes.body.data.reportId;
    assert(!!reportIdA, 'Returns valid reportId', `id: ${reportIdA}`);

    // Wait 3.5 seconds for async PDF generation to complete
    console.log('   Waiting for async PDF generation pipeline...');
    await new Promise((resolve) => setTimeout(resolve, 3800));

    // 4. Verify completed report state in GET /reports
    console.log('\n--- 3. Real Report List Verification (GET /api/v1/reports) ---');
    const listRes = await request('/reports', { headers: authHeadersA });
    assert(listRes.status === 200, 'GET /reports returns 200 OK');
    assert(listRes.body.data.length === 1, 'Returns exactly 1 report in list');

    const rep = listRes.body.data[0];
    assert(rep._id === reportIdA, 'Report ID matches initiated report');
    assert(rep.reportType === 'SEBI_BRSR', 'Report type is SEBI_BRSR');
    assert(rep.period === '2026-08', 'Period matches 2026-08');
    assert(['ready', 'needs_review'].includes(rep.status), 'Report status transitioned to ready or needs_review', `status: ${rep.status}`);
    assert(rep.status !== 'completed', 'Status is NEVER fake "completed"');
    assert(typeof rep.disclosureGapCount === 'number', 'Contains disclosureGapCount');
    assert(!!rep.executiveSummary?.framework, 'Contains executiveSummary.framework');
    assert(!!rep.executiveSummary?.telemetryAndScope, 'Contains executiveSummary.telemetryAndScope');
    assert(!!rep.executiveSummary?.auditLevel, 'Contains executiveSummary.auditLevel');
    assert(!!rep.executiveSummary?.keyFinding, 'Contains executiveSummary.keyFinding');
    assert(!rep.dataSnapshot, 'Heavy raw dataSnapshot is excluded from list view');

    // 5. Verify Report Detail (GET /api/v1/reports/:id)
    console.log('\n--- 4. Report Detail Verification (GET /api/v1/reports/:id) ---');
    const detailRes = await request(`/reports/${reportIdA}`, { headers: authHeadersA });
    assert(detailRes.status === 200, 'GET /reports/:id returns 200 OK');
    const detail = detailRes.body.data;
    assert(detail._id === reportIdA, 'Detail ID matches');
    assert(detail.reportType === 'SEBI_BRSR', 'Detail reportType matches');
    assert(detail.period === '2026-08', 'Detail period matches');
    assert(!!detail.snapshotSummary, 'Detail contains clean snapshotSummary');
    assert(detail.snapshotSummary?.companyName?.includes('Test Reports Corp A'), 'Snapshot contains correct company name');
    assert(!detail.dataSnapshot, 'Heavy dataSnapshot is safely excluded from detail payload');

    // 6. Verify Report Download Access (GET /api/v1/reports/:id/download)
    console.log('\n--- 5. Report Download Access (GET /api/v1/reports/:id/download) ---');
    const downloadRes = await request(`/reports/${reportIdA}/download`, { headers: authHeadersA });
    assert(downloadRes.status === 200, 'GET /reports/:id/download returns 200 OK');
    assert(!!downloadRes.body.data.downloadUrl, 'Returns real downloadUrl');
    assert(downloadRes.body.data.period === '2026-08', 'Download access period matches');
    assert(downloadRes.body.data.reportType === 'SEBI_BRSR', 'Download access reportType matches');

    // 7. Verify Actual Binary Stream from Download URL
    console.log('\n--- 6. Direct Binary PDF Download Verification ---');
    const downloadUrl = downloadRes.body.data.downloadUrl;
    const fullDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : `http://localhost:5001${downloadUrl}`;
    const fileRes = await fetch(fullDownloadUrl);
    assert(fileRes.status === 200, 'Download endpoint returns HTTP 200 OK');
    const contentType = fileRes.headers.get('content-type');
    assert(contentType && contentType.includes('application/pdf'), 'Content-Type is application/pdf', `got: ${contentType}`);
    const arrayBuf = await fileRes.arrayBuffer();
    assert(arrayBuf.byteLength > 1000, 'Downloaded PDF is a valid non-empty binary buffer', `size: ${arrayBuf.byteLength} bytes`);

    // 8. Multi-Tenant Company Isolation
    console.log('\n--- 7. Multi-Tenant Company Isolation ---');
    const compBList = await request('/reports', { headers: authHeadersB });
    assert(compBList.body.data.length === 0, 'Company B cannot see Company A reports (count 0)');

    const compBDetail = await request(`/reports/${reportIdA}`, { headers: authHeadersB });
    assert(compBDetail.status === 404, 'Company B cannot access Company A report detail (returns 404)');

    const compBDownload = await request(`/reports/${reportIdA}/download`, { headers: authHeadersB });
    assert(compBDownload.status === 404, 'Company B cannot access Company A report download (returns 404)');

    // 9. Input Validation & Error Handling
    console.log('\n--- 8. Error Handling & Validation ---');
    const nonExistentRes = await request(`/reports/${new mongoose.Types.ObjectId()}`, { headers: authHeadersA });
    assert(nonExistentRes.status === 404, 'Non-existent report ID returns 404 NOT_FOUND');

    const invalidTypeRes = await request('/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: { reportType: 'INVALID_TYPE', period: '2026-08' },
    });
    assert(invalidTypeRes.status === 400, 'Invalid reportType returns 400 Bad Request');

    const invalidPeriodRes = await request('/reports', {
      method: 'POST',
      headers: authHeadersA,
      body: { reportType: 'SEBI_BRSR', period: 'invalid-period' },
    });
    assert(invalidPeriodRes.status === 400, 'Invalid period returns 400 Bad Request');

    // Cleanup test data
    await Report.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await Company.deleteMany({ _id: { $in: [compA._id, compB._id] } });

    console.log('\n====================================================');
    console.log('📊 PHASE 7I REPORTS TEST SUMMARY');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
  }
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
