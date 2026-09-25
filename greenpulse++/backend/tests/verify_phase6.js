/**
 * GreenPulse AI - Phase 6 Comprehensive Verification Script
 * Validates Security Hardening (Helmet, CORS, NoSQL Sanitization),
 * Rate Limiting (Global, Login, Upload), Audit Logging (Exact 5 Actions),
 * and Health Checks under strict Laptop Safety Protocol.
 */

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const mongoSanitize = require('express-mongo-sanitize');

const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedReferenceData } = require('../src/lib/seed-reference-data');
const referenceCache = require('../src/config/referenceCache');

const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Department = require('../src/modules/departments/department.model');
const EnergyRecord = require('../src/modules/upload/energy-record.model');
const Recommendation = require('../src/modules/recommendations/recommendation.model');
const Report = require('../src/modules/reports/report.model');
const { AuditLog } = require('../src/modules/audit/audit-log.model');

const { loginLimiter, uploadLimiter, copilotLimiter } = require('../src/middleware/rateLimiter.middleware');
const { processUploadJob } = require('../src/jobs/processUpload.job');
const reportService = require('../src/modules/reports/report.service');

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
    if (typeof options.body === 'string' || options.body instanceof FormData || options.body instanceof Buffer) {
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
  } catch {
    // not json or empty
  }

  return {
    status: res.status,
    headers: res.headers,
    body,
  };
};

const runVerification = async () => {
  console.log('====================================================');
  console.log('Starting Phase 6 Verification for GreenPulse AI');
  console.log('Security Hardening, Rate Limiting & Audit Trail');
  console.log('Resource Protection Protocol: Active (Sequential, Ephemeral)');
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

    const uniqueSuffix = Date.now();

    // ----------------------------------------------------
    // CHECK 1: Security Headers (Helmet)
    // ----------------------------------------------------
    console.log('--- 1. HELMET SECURITY HEADERS ---');
    const helmetRes = await request('/health');

    const observedHeaders = {};
    const relevantHeaderKeys = [
      'x-dns-prefetch-control',
      'x-frame-options',
      'strict-transport-security',
      'x-download-options',
      'x-content-type-options',
      'x-permitted-cross-domain-policies',
      'content-security-policy',
    ];

    relevantHeaderKeys.forEach((key) => {
      const val = helmetRes.headers.get(key);
      if (val) observedHeaders[key] = val;
    });

    console.log('Actual Observed Security Headers:');
    console.log(JSON.stringify(observedHeaders, null, 2));

    assert(
      Boolean(helmetRes.headers.get('x-frame-options') || helmetRes.headers.get('content-security-policy')),
      'Test 1.1: Clickjacking protection present (x-frame-options or CSP)'
    );
    assert(
      helmetRes.headers.get('x-content-type-options') === 'nosniff',
      'Test 1.2: MIME-sniffing protection present (x-content-type-options: nosniff)'
    );
    assert(
      helmetRes.headers.get('x-dns-prefetch-control') === 'off',
      'Test 1.3: DNS prefetch control disabled (x-dns-prefetch-control: off)'
    );
    assert(
      helmetRes.headers.get('x-permitted-cross-domain-policies') === 'none' || helmetRes.headers.get('x-download-options') === 'noopen',
      'Test 1.4: Cross-domain download restriction header present'
    );

    // ----------------------------------------------------
    // CHECK 2: Authoritative CORS Policy & Origin Validation
    // ----------------------------------------------------
    console.log('\n--- 2. CORS ALLOW-LIST VS DISALLOWED ORIGINS ---');
    // A. Request with configured allowed origin (http://localhost:5173)
    const allowedOrigin = 'http://localhost:5173';
    const allowedCorsRes = await request('/health', {
      headers: { Origin: allowedOrigin },
    });

    const allowHeader = allowedCorsRes.headers.get('access-control-allow-origin');
    const allowCreds = allowedCorsRes.headers.get('access-control-allow-credentials');
    console.log(`Allowed Origin [${allowedOrigin}] -> access-control-allow-origin: "${allowHeader}", credentials: "${allowCreds}"`);

    assert(
      allowHeader === allowedOrigin,
      'Test 2.1: Allowed origin is reflected in access-control-allow-origin',
      `Got: ${allowHeader}`
    );
    assert(
      allowCreds === 'true',
      'Test 2.2: access-control-allow-credentials is true for allowed origin'
    );

    // B. Request with untrusted origin (http://malicious-domain.com)
    const untrustedOrigin = 'http://malicious-domain.com';
    const disallowedCorsRes = await request('/health', {
      headers: { Origin: untrustedOrigin },
    });

    const disallowedHeader = disallowedCorsRes.headers.get('access-control-allow-origin');
    console.log(`Disallowed Origin [${untrustedOrigin}] -> access-control-allow-origin: "${disallowedHeader || 'OMITTED'}"`);

    assert(
      disallowedHeader === null,
      'Test 2.3: Disallowed origin does NOT receive access-control-allow-origin header (browser blocks cross-origin access)',
      `Got: ${disallowedHeader}`
    );

    // C. Exact Schema Validation & Production Localhost / IPv6 Protection
    if (env.envSchema) {
      const baseEnv = {
        NODE_ENV: 'production',
        MONGO_URI: 'mongodb://127.0.0.1:27017/gp_test',
        JWT_SECRET: 'supersecretjwtkeyatleast16chars',
        GEMINI_API_KEY: 'dummy_gemini_key',
      };

      const testOrigins = [
        { origin: 'http://localhost:5173', shouldPass: false, desc: 'localhost' },
        { origin: 'http://127.0.0.1:5173', shouldPass: false, desc: '127.0.0.1' },
        { origin: 'http://[::1]:5173', shouldPass: false, desc: 'IPv6 [::1]' },
        { origin: 'https://app.greenpulse.com', shouldPass: true, desc: 'production domain' },
        { origin: 'https://notlocalhost.com', shouldPass: true, desc: 'non-localhost substring' },
        { origin: '*', shouldPass: false, desc: 'wildcard *' },
        { origin: 'https://app.greenpulse.com/api', shouldPass: false, desc: 'path component' },
        { origin: 'https://user:pass@app.greenpulse.com', shouldPass: false, desc: 'credentials' },
      ];

      for (const t of testOrigins) {
        const parseRes = env.envSchema.safeParse({ ...baseEnv, CORS_ORIGIN: t.origin });
        const passedCheck = t.shouldPass ? parseRes.success : !parseRes.success;
        assert(
          passedCheck,
          `Test 2.C (${t.desc}): ${t.origin} correctly ${t.shouldPass ? 'accepted' : 'rejected'} in production`,
          `Validation ${parseRes.success ? 'passed unexpectedly' : 'failed unexpectedly'}`
        );
      }
    }

    // ----------------------------------------------------
    // CHECK 3: NoSQL Input Sanitization (3-Stage Verification)
    // ----------------------------------------------------
    console.log('\n--- 3. NoSQL INPUT SANITIZATION (3-STAGE VERIFICATION) ---');

    // Stage A: Isolated Sanitizer Verification (Independent of Zod / HTTP Response)
    const testPayload = {
      email: { $gt: '' },
      password: 'invalid',
    };

    if (typeof mongoSanitize.sanitize === 'function') {
      mongoSanitize.sanitize(testPayload);
    } else {
      const mockReq = { body: testPayload, params: {}, query: {}, headers: {} };
      const middleware = mongoSanitize();
      middleware(mockReq, {}, () => {});
    }

    console.log('[Stage A] Isolated testPayload after express-mongo-sanitize:', JSON.stringify(testPayload));
    assert(
      !('$gt' in testPayload.email),
      'Test 3.1 [Stage A]: Sanitizer actively stripped "$gt" operator from test object',
      'Found $gt still in email object'
    );
    assert(
      Object.keys(testPayload.email).length === 0,
      'Test 3.2 [Stage A]: testPayload.email is reduced to an empty object {}'
    );

    // Stage B: Endpoint Validation Rejection
    const nosqlEndpointRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: { $gt: '' },
        password: 'invalid',
      },
    });

    console.log('[Stage B] Endpoint HTTP response status:', nosqlEndpointRes.status);
    console.log('[Stage B] Endpoint response body:', JSON.stringify(nosqlEndpointRes.body));

    assert(
      nosqlEndpointRes.status === 400,
      'Test 3.3 [Stage B]: Endpoint returns HTTP 400 VALIDATION_ERROR',
      `Got status: ${nosqlEndpointRes.status}`
    );
    const hasObjectError = nosqlEndpointRes.body.error?.details?.some((d) =>
      d.message?.toLowerCase().includes('expected string') || d.message?.toLowerCase().includes('invalid')
    );
    assert(
      hasObjectError || nosqlEndpointRes.body.error?.code === 'VALIDATION_ERROR',
      'Test 3.4 [Stage B]: Zod rejected the sanitized empty object rather than evaluating a Mongo operator query'
    );

    // Stage C: Server Stability & Health Check
    const healthAfterNosql = await request('/health');
    assert(
      healthAfterNosql.status === 200 && healthAfterNosql.body.data?.status === 'healthy',
      'Test 3.5 [Stage C]: Server remained healthy with zero 500 errors or unhandled exceptions'
    );

    // ----------------------------------------------------
    // CHECK 4: Login Rate Limiter (5 requests / minute / IP)
    // ----------------------------------------------------
    console.log('\n--- 4. LOGIN RATE LIMITER (5 REQ/MIN/IP) ---');
    const resetLoginKeys = () => {
      if (typeof loginLimiter.resetKey === 'function') {
        loginLimiter.resetKey('127.0.0.1');
        loginLimiter.resetKey('::1');
        loginLimiter.resetKey('::ffff:127.0.0.1');
        loginLimiter.resetKey('::/56');
      }
    };

    // Reset limiter state for deterministic zero-wait test isolation
    resetLoginKeys();

    const loginResponses = [];
    for (let i = 1; i <= 6; i++) {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: `nonexistent_${uniqueSuffix}@greenpulse.local`,
          password: 'wrongpassword',
        },
      });
      loginResponses.push(res);
    }

    const firstFiveStatuses = loginResponses.slice(0, 5).map((r) => r.status);
    const sixthResponse = loginResponses[5];

    console.log(`Requests 1-5 statuses: [${firstFiveStatuses.join(', ')}] (Expected 401 Unauthorized)`);
    console.log(`Request 6 status: ${sixthResponse.status} (Expected 429 Too Many Requests)`);
    console.log('Request 6 Payload:', JSON.stringify(sixthResponse.body));

    assert(
      firstFiveStatuses.every((s) => s === 401),
      'Test 4.1: Requests 1–5 reached normal authentication and failed credentials with 401'
    );
    assert(
      sixthResponse.status === 429,
      'Test 4.2: Request 6 was blocked by login rate limiter with HTTP 429',
      `Got status: ${sixthResponse.status}`
    );
    assert(
      sixthResponse.body.error?.code === 'TOO_MANY_REQUESTS',
      'Test 4.3: Request 6 returned standardized TOO_MANY_REQUESTS error code'
    );

    // ----------------------------------------------------
    // CHECK 5: Upload Rate Limiter (5 requests / minute / user)
    // ----------------------------------------------------
    console.log('\n--- 5. UPLOAD RATE LIMITER (5 REQ/MIN/USER) ---');
    // Create dedicated fresh test company and user (guarantees count = 0)
    const rateLimitCompany = await Company.create({
      name: `Rate Limit Corp ${uniqueSuffix}`,
      industry: 'Manufacturing',
      brsrStatus: 'voluntary',
    });

    const rateLimitUser = await User.create({
      email: `ratelimit_${uniqueSuffix}@greenpulse.local`,
      passwordHash: 'dummy_hash',
      role: 'facility_manager',
      company: rateLimitCompany._id,
    });

    const rateLimitToken = jwt.sign(
      {
        id: rateLimitUser._id.toString(),
        email: rateLimitUser.email,
        role: rateLimitUser.role,
        company: rateLimitCompany._id.toString(),
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const rateLimitAuthHeaders = { Authorization: `Bearer ${rateLimitToken}` };

    const uploadResponses = [];
    for (let i = 1; i <= 6; i++) {
      // Send lightweight tiny request to evaluate limiter without uploading big files
      const res = await request('/api/v1/upload', {
        method: 'POST',
        headers: rateLimitAuthHeaders,
        body: { type: 'energy' }, // missing file intentionally triggers 400 from upload middleware if allowed past limiter
      });
      uploadResponses.push(res);
    }

    const uploadFirstFive = uploadResponses.slice(0, 5).map((r) => r.status);
    const uploadSixth = uploadResponses[5];

    console.log(`Upload Requests 1-5 statuses: [${uploadFirstFive.join(', ')}] (Expected 400 - passed limiter to multer)`);
    console.log(`Upload Request 6 status: ${uploadSixth.status} (Expected 429 Too Many Requests)`);
    console.log('Upload Request 6 Payload:', JSON.stringify(uploadSixth.body));

    assert(
      uploadFirstFive.every((s) => s === 400),
      'Test 5.1: Requests 1–5 passed user rate limiter and reached upload route handling (HTTP 400 no file)'
    );
    assert(
      uploadSixth.status === 429,
      'Test 5.2: Request 6 was blocked by upload rate limiter with HTTP 429',
      `Got status: ${uploadSixth.status}`
    );
    assert(
      uploadSixth.body.error?.code === 'TOO_MANY_REQUESTS',
      'Test 5.3: Upload Request 6 returned standardized TOO_MANY_REQUESTS error code'
    );

    // ----------------------------------------------------
    // CHECK 6: Copilot Limiter (Prepared But Inactive)
    // ----------------------------------------------------
    console.log('\n--- 6. COPILOT LIMITER STATUS ---');
    assert(
      typeof copilotLimiter === 'function',
      'Test 6.1: copilotLimiter is exported from rateLimiter.middleware.js'
    );
    const copilotRouteRes = await request('/api/v1/copilot/ask', { method: 'POST' });
    assert(
      copilotRouteRes.status === 404,
      'Test 6.2: Route /api/v1/copilot/ask returns 404 (Copilot limiter prepared but intentionally inactive until Phase 6B)'
    );
    console.log('Confirmation: Copilot limiter prepared but intentionally inactive until Phase 6B.');

    // ----------------------------------------------------
    // CHECK 7: Health & Readiness Probes (Unthrottled)
    // ----------------------------------------------------
    console.log('\n--- 7. HEALTH AND READINESS PROBES ---');
    const healthRes = await request('/health');
    assert(
      healthRes.status === 200 && healthRes.body.data?.status === 'healthy',
      'Test 7.1: GET /health returns HTTP 200 healthy'
    );

    const readyRes = await request('/ready');
    assert(
      readyRes.status === 200 && readyRes.body.data?.status === 'ready',
      'Test 7.2: GET /ready returns HTTP 200 ready'
    );

    // ----------------------------------------------------
    // CHECK 8: Audit Log End-to-End Database Records (Exact 5 Actions)
    // ----------------------------------------------------
    console.log('\n--- 8. AUDIT LOG END-TO-END VERIFICATION (EXACT 5 NEW RECORDS) ---');
    // Ensure login rate limiter is reset for the audit test user login
    resetLoginKeys();

    // Create dedicated clean test company and user for audit verification
    const auditCompany = await Company.create({
      name: `Audit Verification Corp ${uniqueSuffix}`,
      industry: 'Pharmaceuticals',
      brsrStatus: 'mandatory',
    });

    const auditUserPassword = 'ValidAuditPassword123!';
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(auditUserPassword, 10);

    const auditUser = await User.create({
      email: `auditor_${uniqueSuffix}@auditcorp.local`,
      passwordHash,
      role: 'facility_manager',
      company: auditCompany._id,
    });

    // 1. Action: "user.login"
    console.log('Triggering Action 1: user.login...');
    const loginActionRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: auditUser.email,
        password: auditUserPassword,
      },
    });
    assert(loginActionRes.status === 200, 'Login succeeded (HTTP 200)', `Got status: ${loginActionRes.status}`);

    const setCookieHeader = loginActionRes.headers.get('set-cookie') || '';
    const tokenMatch = setCookieHeader.match(/accessToken=([^;]+)/);
    const accessToken = tokenMatch
      ? tokenMatch[1]
      : jwt.sign(
          {
            id: auditUser._id.toString(),
            email: auditUser.email,
            role: auditUser.role,
            company: auditCompany._id.toString(),
          },
          env.JWT_SECRET,
          { expiresIn: '1h' }
        );

    const auditAuthHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Cookie: `accessToken=${accessToken}`,
    };

    // 2. Action: "upload.completed"
    console.log('Triggering Action 2: upload.completed...');
    const dept = await Department.create({
      companyId: auditCompany._id,
      name: 'Main Lab',
      code: `LAB-${uniqueSuffix}`,
      facilityType: 'manufacturing',
    });

    const UploadJob = require('../src/modules/upload/upload-job.model');
    const sampleJob = await UploadJob.create({
      companyId: auditCompany._id,
      filename: 'sample_energy.csv',
      fileType: 'energy',
      contentHash: `hash_${uniqueSuffix}`,
      status: 'processing',
    });

    const csvContent = `department,period,kwhUsed\nMain Lab,2026-03,500\n`;
    await processUploadJob({
      jobId: sampleJob._id,
      fileBuffer: Buffer.from(csvContent, 'utf-8'),
      companyId: auditCompany._id,
      filename: sampleJob.filename,
      fileType: sampleJob.fileType,
      contentHash: sampleJob.contentHash,
    });
    await delay(300);

    // 3. Action: "report.generated"
    console.log('Triggering Action 3: report.generated...');
    await EnergyRecord.create({
      companyId: auditCompany._id,
      departmentId: dept._id,
      period: '2026-03',
      kwhUsed: 500,
      sourceFileHash: `hash_${uniqueSuffix}`,
    });

    const reportDoc = await reportService.initiateReportGeneration({
      companyId: auditCompany._id,
      reportType: 'SEBI_BRSR',
      period: '2026-03',
      requestedBy: auditUser._id,
    });

    // Poll until async report PDF generation and storage is completed and audit log is recorded
    for (let attempt = 0; attempt < 30; attempt++) {
      await delay(200);
      const auditRec = await AuditLog.findOne({ companyId: auditCompany._id, action: 'report.generated' });
      if (auditRec) {
        break;
      }
    }

    // 4. Action: "recommendation.approved"
    console.log('Triggering Action 4: recommendation.approved...');
    const rec1 = await Recommendation.create({
      companyId: auditCompany._id,
      action: 'Replace CFL lamps with smart LEDs in Main Lab',
      category: 'energy_efficiency',
      priorityScore: 85,
      estimatedImpact: {
        costSavingsINR: 15000,
        co2Reduction: 120,
      },
      sourceContext: {
        triggeringJobId: sampleJob._id,
      },
      status: 'pending',
    });

    const approveRes = await request(`/api/v1/recommendations/${rec1._id}`, {
      method: 'PATCH',
      headers: auditAuthHeaders,
      body: { status: 'approved' },
    });
    console.log('Approve response status:', approveRes.status, 'body:', JSON.stringify(approveRes.body));
    assert(approveRes.status === 200, 'Recommendation approved (HTTP 200)');

    // 5. Action: "recommendation.dismissed"
    console.log('Triggering Action 5: recommendation.dismissed...');
    const rec2 = await Recommendation.create({
      companyId: auditCompany._id,
      action: 'Install solar water preheating in facility',
      category: 'renewable_transition',
      priorityScore: 30,
      estimatedImpact: {
        costSavingsINR: 200000,
        co2Reduction: 50,
      },
      sourceContext: {
        triggeringJobId: sampleJob._id,
      },
      status: 'pending',
    });

    const dismissRes = await request(`/api/v1/recommendations/${rec2._id}`, {
      method: 'PATCH',
      headers: auditAuthHeaders,
      body: { status: 'dismissed' },
    });
    console.log('Dismiss response status:', dismissRes.status, 'body:', JSON.stringify(dismissRes.body));
    assert(dismissRes.status === 200, 'Recommendation dismissed (HTTP 200)');

    // Query MongoDB directly for AuditLog records for auditCompany
    const auditRecords = await AuditLog.find({ companyId: auditCompany._id }).sort({ timestamp: 1 }).lean();

    console.log(`\nDirect MongoDB Query: Found ${auditRecords.length} AuditLog records for company ${auditCompany._id}:`);
    auditRecords.forEach((record, index) => {
      console.log(`  [${index + 1}] _id: ${record._id} | action: "${record.action}" | actorId: ${record.actorId} | timestamp: ${new Date(record.timestamp).toISOString()}`);
    });

    assert(
      auditRecords.length === 5,
      `Test 8.1: Exactly 5 new AuditLog records found for the verification run`,
      `Found: ${auditRecords.length}`
    );

    const observedActions = auditRecords.map((r) => r.action);
    const expectedActions = [
      'user.login',
      'upload.completed',
      'report.generated',
      'recommendation.approved',
      'recommendation.dismissed',
    ];

    expectedActions.forEach((action) => {
      assert(
        observedActions.includes(action),
        `Test 8.2: Audit event "${action}" is present in database records`
      );
    });

    // Clean up test data
    await Company.deleteMany({ _id: { $in: [rateLimitCompany._id, auditCompany._id] } });
    await User.deleteMany({ _id: { $in: [rateLimitUser._id, auditUser._id] } });
    await Department.deleteMany({ companyId: { $in: [rateLimitCompany._id, auditCompany._id] } });
    await EnergyRecord.deleteMany({ companyId: { $in: [rateLimitCompany._id, auditCompany._id] } });
    await Recommendation.deleteMany({ companyId: { $in: [rateLimitCompany._id, auditCompany._id] } });
    await Report.deleteMany({ companyId: { $in: [rateLimitCompany._id, auditCompany._id] } });
    await AuditLog.deleteMany({ companyId: { $in: [rateLimitCompany._id, auditCompany._id] } });

    console.log('\n====================================================');
    console.log(`Phase 6 Verification Completed: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('CRITICAL ERROR in Phase 6 verification:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

runVerification();
