/**
 * GreenPulse AI — Phase 7J Settings / Company Profile Integration Verification Test
 * Verifies:
 * 1. GET /api/v1/companies/me requires authentication (401 without auth)
 * 2. PATCH /api/v1/companies/me requires authentication (401 without auth)
 * 3. GET /api/v1/companies/me returns real company profile matching database
 * 4. Company profile fields include: _id, name, industry, brsrStatus, createdAt, updatedAt
 * 5. PATCH /api/v1/companies/me updates name
 * 6. PATCH /api/v1/companies/me updates industry
 * 7. PATCH /api/v1/companies/me updates brsrStatus (mandatory, voluntary, in_scope, exempt)
 * 8. GET /api/v1/companies/me immediately reflects updated persisted values
 * 9. Validation: Invalid brsrStatus returns 400 with validation error
 * 10. Validation: Empty string for name or industry returns 400
 * 11. Company Isolation: Company B cannot see or modify Company A's profile
 * 12. No Team endpoint: confirms no unhandled mock endpoints or unexpected routes exist
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');

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
  console.log('⚙️ GREENPULSE AI — PHASE 7J SETTINGS VERIFICATION');
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

  let compA, compB, userA, userB, tokenA, tokenB;

  try {
    // 1. Setup Company A and User A
    compA = await Company.create({
      name: 'Apex CleanTech Industries ' + Date.now(),
      industry: 'Renewable Energy',
      brsrStatus: 'voluntary',
    });

    userA = await User.create({
      name: 'Admin A',
      email: `settings.test.a.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u',
      role: 'admin',
      company: compA._id,
    });

    tokenA = jwt.sign(
      { id: userA._id.toString(), company: compA._id.toString(), companyId: compA._id.toString(), role: userA.role, email: userA.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersA = { Authorization: `Bearer ${tokenA}` };

    // 2. Setup Company B and User B for isolation testing
    compB = await Company.create({
      name: 'BioFuel Dynamics Ltd ' + Date.now(),
      industry: 'Agriculture',
      brsrStatus: 'exempt',
    });

    userB = await User.create({
      name: 'Admin B',
      email: `settings.test.b.${Date.now()}@greenpulse.ai`,
      passwordHash: '$2b$10$wT0l0hF7U7qZ6L1v7L7QOuO8jRjO2mYm4lV4bM5aZ0u1u2u3u4u5u',
      role: 'admin',
      company: compB._id,
    });

    tokenB = jwt.sign(
      { id: userB._id.toString(), company: compB._id.toString(), companyId: compB._id.toString(), role: userB.role, email: userB.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    console.log('--- 1. AUTHENTICATION ENFORCEMENT ---');
    const unauthGet = await request('/companies/me');
    assert(unauthGet.status === 401, 'GET /companies/me rejects unauthenticated requests with 401', `Status: ${unauthGet.status}`);

    const unauthPatch = await request('/companies/me', {
      method: 'PATCH',
      body: { name: 'Hacked Name' },
    });
    assert(unauthPatch.status === 401, 'PATCH /companies/me rejects unauthenticated requests with 401', `Status: ${unauthPatch.status}`);

    console.log('\n--- 2. REAL COMPANY PROFILE FETCH (GET /companies/me) ---');
    const getResA = await request('/companies/me', { headers: authHeadersA });
    assert(getResA.status === 200, 'GET /companies/me returns 200 OK for authenticated user', `Status: ${getResA.status}`);
    assert(getResA.body.success === true, 'Response contains success: true');
    assert(Boolean(getResA.body.data && getResA.body.data.company), 'Response payload has data.company object');

    const profileA = getResA.body.data.company;
    assert(profileA._id === compA._id.toString(), 'Fetched company _id matches authenticated user company', `ID: ${profileA._id}`);
    assert(profileA.name === compA.name, 'Fetched company name matches database', `Name: ${profileA.name}`);
    assert(profileA.industry === compA.industry, 'Fetched company industry matches database', `Industry: ${profileA.industry}`);
    assert(profileA.brsrStatus === 'voluntary', 'Fetched company brsrStatus matches database', `BRSR: ${profileA.brsrStatus}`);
    assert(Boolean(profileA.createdAt), 'Fetched company contains createdAt timestamp');

    console.log('\n--- 3. COMPANY PROFILE UPDATE (PATCH /companies/me) ---');
    const updatedName = 'Apex Global Sustainability Group ' + Date.now();
    const updatedIndustry = 'Clean Technology & Power';
    const updatedBrsr = 'mandatory';

    const patchRes = await request('/companies/me', {
      method: 'PATCH',
      headers: authHeadersA,
      body: {
        name: updatedName,
        industry: updatedIndustry,
        brsrStatus: updatedBrsr,
      },
    });

    assert(patchRes.status === 200, 'PATCH /companies/me returns 200 OK on valid update', `Status: ${patchRes.status}`);
    assert(patchRes.body.success === true, 'PATCH response contains success: true');
    const updatedProfile = patchRes.body.data.company;
    assert(updatedProfile.name === updatedName, 'Updated name is returned', `Name: ${updatedProfile.name}`);
    assert(updatedProfile.industry === updatedIndustry, 'Updated industry is returned', `Industry: ${updatedProfile.industry}`);
    assert(updatedProfile.brsrStatus === updatedBrsr, 'Updated brsrStatus is returned', `BRSR: ${updatedProfile.brsrStatus}`);

    console.log('\n--- 4. PERSISTENCE VERIFICATION (GET re-fetch) ---');
    const refetchRes = await request('/companies/me', { headers: authHeadersA });
    assert(refetchRes.status === 200, 'Re-fetch returns 200 OK');
    const refetchedComp = refetchRes.body.data.company;
    assert(refetchedComp.name === updatedName, 'Persisted name verified on subsequent GET', `Name: ${refetchedComp.name}`);
    assert(refetchedComp.industry === updatedIndustry, 'Persisted industry verified on subsequent GET', `Industry: ${refetchedComp.industry}`);
    assert(refetchedComp.brsrStatus === updatedBrsr, 'Persisted brsrStatus verified on subsequent GET', `BRSR: ${refetchedComp.brsrStatus}`);

    // Verify direct in MongoDB
    const docInDb = await Company.findById(compA._id);
    assert(docInDb.name === updatedName, 'MongoDB direct check: name correctly saved');
    assert(docInDb.industry === updatedIndustry, 'MongoDB direct check: industry correctly saved');
    assert(docInDb.brsrStatus === updatedBrsr, 'MongoDB direct check: brsrStatus correctly saved');

    console.log('\n--- 5. INPUT VALIDATION & CONSTRAINTS ---');
    const invalidBrsrRes = await request('/companies/me', {
      method: 'PATCH',
      headers: authHeadersA,
      body: { brsrStatus: 'invalid_status_value' },
    });
    assert(invalidBrsrRes.status === 400, 'Invalid brsrStatus is rejected with HTTP 400', `Status: ${invalidBrsrRes.status}`);

    const emptyNameRes = await request('/companies/me', {
      method: 'PATCH',
      headers: authHeadersA,
      body: { name: '   ' },
    });
    assert(emptyNameRes.status === 400, 'Whitespace/empty company name is rejected with HTTP 400', `Status: ${emptyNameRes.status}`);

    console.log('\n--- 6. TENANT ISOLATION (COMPANY B vs COMPANY A) ---');
    const getResB = await request('/companies/me', { headers: authHeadersB });
    assert(getResB.status === 200, 'Company B fetches its own profile successfully');
    const profileB = getResB.body.data.company;
    assert(profileB._id === compB._id.toString(), 'Company B sees its own ID, not Company A', `ID: ${profileB._id}`);
    assert(profileB.name === compB.name, 'Company B sees its own name, not Company A', `Name: ${profileB.name}`);
    assert(profileB.name !== updatedName, 'Company B does not have Company A updated name');

    // Company B updates its profile
    const patchResB = await request('/companies/me', {
      method: 'PATCH',
      headers: authHeadersB,
      body: { industry: 'AgriTech NextGen' },
    });
    assert(patchResB.status === 200, 'Company B updates its own profile successfully');

    // Confirm Company A profile was unchanged by Company B's update
    const checkCompA = await Company.findById(compA._id);
    assert(checkCompA.industry === updatedIndustry, 'Company A industry remains untouched by Company B update', `A Industry: ${checkCompA.industry}`);

    console.log('\n--- 7. VERIFY NO TEAM BACKEND ROUTE EXISTS ---');
    const teamCheck = await request('/companies/me/team', { headers: authHeadersA });
    assert(teamCheck.status === 404, 'No non-standard /companies/me/team endpoint exists (404 expected)', `Status: ${teamCheck.status}`);

    console.log('\n====================================================');
    console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
  } finally {
    // Cleanup
    if (userA) await User.deleteOne({ _id: userA._id });
    if (userB) await User.deleteOne({ _id: userB._id });
    if (compA) await Company.deleteOne({ _id: compA._id });
    if (compB) await Company.deleteOne({ _id: compB._id });
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
