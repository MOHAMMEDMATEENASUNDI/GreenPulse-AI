/**
 * GreenPulse AI — Phase 7H Recommendations Backend Verification Test
 * Verifies:
 * 1. GET /api/v1/recommendations returns real company recommendations
 * 2. Recommendations include real priorityScore, category, action, and estimatedImpact
 * 3. Status filtering (pending, approved, dismissed, all)
 * 4. PATCH /api/v1/recommendations/:id with status 'approved'
 * 5. PATCH /api/v1/recommendations/:id with status 'dismissed'
 * 6. Audit logging for approve and dismiss events
 * 7. Validation rejects invalid status values
 * 8. Company isolation (Company B cannot read or patch Company A recommendations)
 */

const http = require('http');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Recommendation = require('../src/modules/recommendations/recommendation.model');
const UploadJob = require('../src/modules/upload/upload-job.model');
const recommendationService = require('../src/modules/recommendations/recommendation.service');
const { AuditLog } = require('../src/modules/audit/audit-log.model');

let testServer;
let baseUrl = 'http://localhost:5001/api/v1';

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
  console.log('🌿 GREENPULSE AI — PHASE 7H RECOMMENDATIONS VERIFICATION');
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
      name: 'Test Recs Corp A ' + Date.now(),
      industry: 'Manufacturing',
      country: 'India',
    });

    const userA = await User.create({
      name: 'Elena Rostova',
      email: `recs.test.a.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u', // dummy hash
      role: 'facility_manager',
      company: compA._id,
    });

    // Login user A to get cookie/token
    // Or generate JWT directly
    const jwt = require('jsonwebtoken');
    const tokenA = jwt.sign(
      { id: userA._id.toString(), company: compA._id.toString(), role: userA.role, email: userA.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersA = { Authorization: `Bearer ${tokenA}` };

    // Setup Company B and User B for isolation testing
    const compB = await Company.create({
      name: 'Test Recs Corp B ' + Date.now(),
      industry: 'Automotive',
      country: 'India',
    });

    const userB = await User.create({
      name: 'Marcus Vance',
      email: `recs.test.b.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u',
      role: 'facility_manager',
      company: compB._id,
    });

    const tokenB = jwt.sign(
      { id: userB._id.toString(), company: compB._id.toString(), role: userB.role, email: userB.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    // 2. Initial state: verify empty recommendations for Company A
    console.log('--- 1. Initial State & Empty Queue Verification ---');
    const initRes = await request('/recommendations', { headers: authHeadersA });
    assert(initRes.status === 200, 'GET /recommendations returns 200 for new company');
    assert(Array.isArray(initRes.body.data.recommendations), 'Returns recommendations array');
    assert(initRes.body.data.recommendations.length === 0, 'Initial recommendations array is empty');

    // 3. Seed real scored recommendations for Company A
    console.log('\n--- 2. Grounded Recommendation Seeding ---');
    const jobA = await UploadJob.create({
      companyId: compA._id,
      filename: 'telemetry_q3.csv',
      contentHash: 'hash-' + Date.now(),
      fileType: 'energy',
      status: 'completed',
    });

    const rawRecs = [
      {
        action: 'Shift Paint Shop drying ovens to night shift tariff window',
        category: 'energy_efficiency',
        estimatedCostSavingsINR: 85000,
        estimatedCO2ReductionKg: 620,
        implementationEffort: 'low',
        geminiImpactScore: 92,
      },
      {
        action: 'Upgrade hydraulic pump motors on Stamping Line 2 to IE4 super-premium efficiency',
        category: 'operational_optimization',
        estimatedCostSavingsINR: 42000,
        estimatedCO2ReductionKg: 310,
        implementationEffort: 'medium',
        geminiImpactScore: 80,
      },
      {
        action: 'Install 250kW rooftop solar array on main warehouse roof',
        category: 'renewable_transition',
        estimatedCostSavingsINR: 120000,
        estimatedCO2ReductionKg: 950,
        implementationEffort: 'high',
        geminiImpactScore: 95,
      },
    ];

    const scored = recommendationService.calculateBatchPriorityScores(rawRecs);
    const sourceContext = {
      triggeringJobId: jobA._id,
      carbonSummary: { totalKgCO2e: 150000, scope2KgCO2e: 120000 },
      anomalySummaries: [
        { departmentName: 'Paint Shop', period: '2026-08', deviationPercent: 38.2, severity: 'high' },
      ],
      greenScoreBreakdown: { overallScore: 70, energyEfficiencyScore: 65, complianceScore: 80 },
    };

    const persisted = await recommendationService.persistScoredRecommendations({
      companyId: compA._id,
      jobId: jobA._id,
      scoredItems: scored,
      sourceContext,
    });
    assert(persisted.length === 3, 'Successfully seeded 3 scored recommendations');

    // 4. Fetch recommendations from GET /recommendations
    console.log('\n--- 3. Real Recommendations Endpoint Verification ---');
    const getRes = await request('/recommendations', { headers: authHeadersA });
    assert(getRes.status === 200, 'GET /recommendations returns 200 OK');
    const recsList = getRes.body.data.recommendations;
    assert(recsList.length === 3, 'Returns exactly 3 recommendations', `got: ${recsList.length}`);

    // Verify ordering by priorityScore descending
    assert(
      recsList[0].priorityScore >= recsList[1].priorityScore &&
      recsList[1].priorityScore >= recsList[2].priorityScore,
      'Recommendations sorted by priorityScore descending',
      `Scores: ${recsList.map(r => r.priorityScore).join(', ')}`
    );

    const first = recsList[0];
    assert(typeof first.action === 'string' && first.action.length > 5, 'Contains real action description');
    assert(['energy_efficiency', 'operational_optimization', 'renewable_transition', 'waste_reduction'].includes(first.category), 'Contains valid category');
    assert(first.priorityScore >= 0 && first.priorityScore <= 100, 'Contains valid priorityScore (0-100)');
    assert(first.status === 'pending', 'Initial status is strictly "pending"');
    assert(typeof first.estimatedImpact.costSavingsINR === 'number' && first.estimatedImpact.costSavingsINR > 0, 'Contains real costSavingsINR');
    assert(typeof first.estimatedImpact.co2Reduction === 'number' && first.estimatedImpact.co2Reduction > 0, 'Contains real co2Reduction');
    assert(first.sourceContext?.anomalySummaries?.[0]?.departmentName === 'Paint Shop', 'Contains grounded department context');

    // 5. Status Actions: Approve
    console.log('\n--- 4. Status Action: Approve ---');
    const recToApprove = recsList[0];
    const approveRes = await request(`/recommendations/${recToApprove._id}`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: JSON.stringify({ status: 'approved' }),
    });
    assert(approveRes.status === 200, 'PATCH /recommendations/:id with status "approved" returns 200 OK');
    assert(approveRes.body.data.recommendation.status === 'approved', 'Updated status is "approved"');
    assert(approveRes.body.data.recommendation.respondedAt !== null, 'respondedAt timestamp is recorded');

    // Verify audit log for approval
    const auditApprove = await AuditLog.findOne({
      companyId: compA._id,
      action: 'recommendation.approved',
    });
    assert(!!auditApprove, 'Audit event recorded for recommendation.approved');

    // 6. Status Actions: Dismiss
    console.log('\n--- 5. Status Action: Dismiss ---');
    const recToDismiss = recsList[1];
    const dismissRes = await request(`/recommendations/${recToDismiss._id}`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: JSON.stringify({ status: 'dismissed' }),
    });
    assert(dismissRes.status === 200, 'PATCH /recommendations/:id with status "dismissed" returns 200 OK');
    assert(dismissRes.body.data.recommendation.status === 'dismissed', 'Updated status is "dismissed"');

    // Verify audit log for dismissal
    const auditDismiss = await AuditLog.findOne({
      companyId: compA._id,
      action: 'recommendation.dismissed',
    });
    assert(!!auditDismiss, 'Audit event recorded for recommendation.dismissed');

    // 7. Filtering Verification
    console.log('\n--- 6. Status Query Filtering ---');
    const pendingOnlyRes = await request('/recommendations?status=pending', { headers: authHeadersA });
    console.log('pendingOnlyRes status:', pendingOnlyRes.status, 'body:', JSON.stringify(pendingOnlyRes.body));
    assert(pendingOnlyRes.status === 200, 'GET /recommendations?status=pending returns 200');
    assert(pendingOnlyRes.body?.data?.recommendations?.length === 1, 'Only 1 pending recommendation remains');
    assert(pendingOnlyRes.body?.data?.recommendations?.[0]?.status === 'pending', 'Status is pending');

    const approvedOnlyRes = await request('/recommendations?status=approved', { headers: authHeadersA });
    assert(approvedOnlyRes.status === 200, 'GET /recommendations?status=approved returns 200');
    assert(approvedOnlyRes.body.data.recommendations.length === 1, 'Only 1 approved recommendation');
    assert(approvedOnlyRes.body.data.recommendations[0].status === 'approved', 'Status is approved');

    const dismissedOnlyRes = await request('/recommendations?status=dismissed', { headers: authHeadersA });
    assert(dismissedOnlyRes.status === 200, 'GET /recommendations?status=dismissed returns 200');
    assert(dismissedOnlyRes.body.data.recommendations.length === 1, 'Only 1 dismissed recommendation');
    assert(dismissedOnlyRes.body.data.recommendations[0].status === 'dismissed', 'Status is dismissed');

    // 8. Validation Rejection
    console.log('\n--- 7. Input Validation & Error Handling ---');
    const invalidStatusRes = await request(`/recommendations/${recToApprove._id}`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: JSON.stringify({ status: 'invalid_status_xyz' }),
    });
    assert(invalidStatusRes.status === 400, 'Invalid status returns 400 Bad Request');

    const nonExistentRes = await request(`/recommendations/${new mongoose.Types.ObjectId()}`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: JSON.stringify({ status: 'approved' }),
    });
    assert(nonExistentRes.status === 404, 'Non-existent recommendation returns 404 NOT_FOUND');

    // 9. Company Isolation
    console.log('\n--- 8. Multi-Tenant Company Isolation ---');
    const crossCompanyGet = await request('/recommendations', { headers: authHeadersB });
    assert(crossCompanyGet.body.data.recommendations.length === 0, 'Company B cannot see Company A recommendations (count 0)');

    const crossCompanyPatch = await request(`/recommendations/${recToApprove._id}`, {
      method: 'PATCH',
      headers: authHeadersB,
      body: JSON.stringify({ status: 'dismissed' }),
    });
    assert(crossCompanyPatch.status === 404, 'Company B cannot patch Company A recommendation (returns 404)');

    // Cleanup test data
    await Recommendation.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await UploadJob.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await Company.deleteMany({ _id: { $in: [compA._id, compB._id] } });

    console.log('\n====================================================');
    console.log('📊 PHASE 7H RECOMMENDATIONS TEST SUMMARY');
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
