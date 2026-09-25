/**
 * GreenPulse AI — ESG Evidence Resolution Verification Test
 * Verifies:
 * 1. Malformed evidence request rejected (HTTP 400)
 * 2. Invalid principle number rejected (HTTP 400)
 * 3. Unauthorized request rejected (HTTP 401)
 * 4. Non-permitted role (e.g. auditor) rejected (HTTP 403)
 * 5. Valid evidence accepted for admin/facility_manager (HTTP 200)
 * 6. Only selected principle changes (isolation)
 * 7. Matching gaps disappear
 * 8. Provenance shows [SEEDED DEMO EVIDENCE]
 * 9. GET /api/v1/esg/score reflects updated state
 * 10. Generating a new report snapshots the updated ESG state
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const PrincipleDisclosure = require('../src/modules/esg/principle-disclosure.model');
const Report = require('../src/modules/reports/report.model');

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
  console.log('🛡️ GREENPULSE AI — ESG EVIDENCE RESOLUTION VERIFICATION');
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

  let compA, adminUser, auditorUser, adminToken, auditorToken;

  try {
    // 1. Setup Company A and Users
    compA = await Company.create({
      name: 'Shield Compliance Corp ' + Date.now(),
      industry: 'Manufacturing',
      brsrStatus: 'mandatory',
    });

    adminUser = await User.create({
      name: 'Admin Shield',
      email: `shield.admin.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u',
      role: 'admin',
      company: compA._id,
    });

    auditorUser = await User.create({
      name: 'Auditor Shield',
      email: `shield.auditor.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u',
      role: 'auditor',
      company: compA._id,
    });

    adminToken = jwt.sign(
      { id: adminUser._id.toString(), company: compA._id.toString(), companyId: compA._id.toString(), role: adminUser.role, email: adminUser.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    auditorToken = jwt.sign(
      { id: auditorUser._id.toString(), company: compA._id.toString(), companyId: compA._id.toString(), role: auditorUser.role, email: auditorUser.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const auditorHeaders = { Authorization: `Bearer ${auditorToken}` };

    console.log('--- 1. AUTHENTICATION & RBAC ENFORCEMENT ---');
    const unauthRes = await request('/esg/principles/2/evidence', {
      method: 'POST',
      body: { evidenceType: 'demo', evidenceItems: [{ name: 'Test', reference: 'REF' }] },
    });
    assert(unauthRes.status === 401, 'Unauthenticated POST /esg/principles/:num/evidence returns 401', `Status: ${unauthRes.status}`);

    const auditorRes = await request('/esg/principles/2/evidence', {
      method: 'POST',
      headers: auditorHeaders,
      body: { evidenceType: 'demo', evidenceItems: [{ name: 'Test', reference: 'REF' }] },
    });
    assert(auditorRes.status === 403, 'Auditor role without write permissions returns 403 Forbidden', `Status: ${auditorRes.status}`);

    console.log('\n--- 2. INPUT VALIDATION ---');
    const invalidPrincipleRes = await request('/esg/principles/99/evidence', {
      method: 'POST',
      headers: adminHeaders,
      body: { evidenceType: 'demo', evidenceItems: [{ name: 'Test', reference: 'REF' }] },
    });
    assert(invalidPrincipleRes.status === 400, 'Invalid principle number 99 is rejected with 400', `Status: ${invalidPrincipleRes.status}`);

    const emptyItemsRes = await request('/esg/principles/2/evidence', {
      method: 'POST',
      headers: adminHeaders,
      body: { evidenceType: 'demo', evidenceItems: [] },
    });
    assert(emptyItemsRes.status === 400, 'Empty evidenceItems array is rejected with 400', `Status: ${emptyItemsRes.status}`);

    const emptyNameRes = await request('/esg/principles/2/evidence', {
      method: 'POST',
      headers: adminHeaders,
      body: { evidenceType: 'demo', evidenceItems: [{ name: '   ', reference: 'REF' }] },
    });
    assert(emptyNameRes.status === 400, 'Whitespace evidence name is rejected with 400', `Status: ${emptyNameRes.status}`);

    console.log('\n--- 3. INITIAL ESG STATE INSPECTION ---');
    const initialEsg = await request('/esg/score', { headers: adminHeaders });
    assert(initialEsg.status === 200, 'GET /esg/score returns 200 OK');
    const p2Initial = initialEsg.body.data.principles.find((p) => p.number === 2);
    const p3Initial = initialEsg.body.data.principles.find((p) => p.number === 3);
    assert(Boolean(p2Initial), 'Principle 2 exists in initial ESG response');
    assert(p2Initial.status === 'partial', 'Principle 2 is initially partial');
    assert(p2Initial.coveragePercent === 65, 'Principle 2 initial coverage is 65%');
    assert(p2Initial.specificGaps.length === 2, 'Principle 2 initially has 2 specific gaps', `Gaps: ${p2Initial.specificGaps.length}`);

    console.log('\n--- 4. POST DEMO EVIDENCE TO PRINCIPLE 2 ---');
    const attachRes = await request('/esg/principles/2/evidence', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        evidenceType: 'demo',
        evidenceItems: [
          {
            name: 'Raw Material Procurement Ledger',
            reference: 'DEMO-PR-001',
          },
          {
            name: 'Life Cycle Assessment',
            reference: 'DEMO-LCA-001',
          },
          {
            name: 'Recycled Input Material',
            reference: 'DEMO-RIM-001',
          },
        ],
      },
    });

    assert(attachRes.status === 200, 'POST /esg/principles/2/evidence returns 200 OK', `Status: ${attachRes.status}`);
    assert(attachRes.body.success === true, 'Response contains success: true');
    const updatedP2 = attachRes.body.data;
    assert(updatedP2.number === 2, 'Response data principle number is 2');
    assert(updatedP2.status === 'complete', 'Principle 2 status transitions to complete when all gaps resolved', `Status: ${updatedP2.status}`);
    assert(updatedP2.coveragePercent === 100, 'Principle 2 coverage transitions to 100%', `Coverage: ${updatedP2.coveragePercent}`);
    assert(updatedP2.specificGaps.length === 0, 'Principle 2 specificGaps are resolved (length 0)', `Gaps left: ${updatedP2.specificGaps.length}`);

    // Verify mapped evidence format [SEEDED DEMO EVIDENCE]
    const hasFormattedLca = updatedP2.mappedEvidence.some((m) =>
      m.includes('[SEEDED DEMO EVIDENCE] Life Cycle Assessment — DEMO-LCA-001')
    );
    const hasFormattedRim = updatedP2.mappedEvidence.some((m) =>
      m.includes('[SEEDED DEMO EVIDENCE] Recycled Input Material — DEMO-RIM-001')
    );
    const hasFormattedPr = updatedP2.mappedEvidence.some((m) =>
      m.includes('[SEEDED DEMO EVIDENCE] Raw Material Procurement Ledger — DEMO-PR-001')
    );
    assert(hasFormattedLca, 'Mapped evidence contains [SEEDED DEMO EVIDENCE] Life Cycle Assessment');
    assert(hasFormattedRim, 'Mapped evidence contains [SEEDED DEMO EVIDENCE] Recycled Input Material');
    assert(hasFormattedPr, 'Mapped evidence contains [SEEDED DEMO EVIDENCE] Raw Material Procurement Ledger');

    // Verify activeDataSources
    assert(
      updatedP2.activeDataSources.includes('[SEEDED DEMO] Evidence Resolution'),
      'activeDataSources includes [SEEDED DEMO] Evidence Resolution'
    );

    console.log('\n--- 5. PRINCIPLE ISOLATION VERIFICATION ---');
    const esgAfterP2 = await request('/esg/score', { headers: adminHeaders });
    const p3After = esgAfterP2.body.data.principles.find((p) => p.number === 3);
    assert(p3After.status === p3Initial.status, 'Principle 3 status is untouched and preserved');
    assert(p3After.coveragePercent === p3Initial.coveragePercent, 'Principle 3 coverage is untouched and preserved');
    assert(p3After.specificGaps.length === p3Initial.specificGaps.length, 'Principle 3 specific gaps are untouched');

    console.log('\n--- 6. REPORT GENERATION SNAPSHOT VERIFICATION ---');
    // Generate new report from the resolved state
    const reportRes = await request('/reports', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        reportType: 'SEBI_BRSR',
        period: '2026-08',
      },
    });

    assert(reportRes.status === 202, 'POST /reports initiated with 202 Accepted', `Status: ${reportRes.status}`);
    const reportId = reportRes.body.data.reportId || reportRes.body.data._id;
    assert(Boolean(reportId), 'Report ID returned', `ID: ${reportId}`);

    // Wait 2 seconds for generation pipeline
    await new Promise((r) => setTimeout(r, 2000));

    // Fetch report detail from database
    const savedReport = await Report.findById(reportId);
    assert(Boolean(savedReport), 'Report document exists in MongoDB');
    if (savedReport && savedReport.dataSnapshot && savedReport.dataSnapshot.esg) {
      const snapP2 = savedReport.dataSnapshot.esg.principles.find((p) => p.principleNumber === 2);
      assert(Boolean(snapP2), 'Report dataSnapshot contains Principle 2');
      assert(snapP2.status === 'complete', 'Report dataSnapshot contains resolved status (complete)');
      assert(snapP2.coveragePercentage === 100, 'Report dataSnapshot contains resolved coverage (100%)');
      console.log('     └─ Report correctly captured the updated ESG state!');
    }

    console.log('\n====================================================');
    console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
  } finally {
    // Cleanup
    if (adminUser) await User.deleteOne({ _id: adminUser._id });
    if (auditorUser) await User.deleteOne({ _id: auditorUser._id });
    if (compA) {
      await PrincipleDisclosure.deleteMany({ companyId: compA._id });
      await Report.deleteMany({ companyId: compA._id });
      await Company.deleteOne({ _id: compA._id });
    }
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
