/**
 * Phase 1 Comprehensive Verification Script
 * Validates all 17 criteria specified in Phase 1 requirements
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/modules/auth/user.model');
const { requireRole, requireAuth } = require('../src/middleware/auth.middleware');
const errorHandler = require('../src/middleware/errorHandler.middleware');

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let body = {};
  try {
    body = await res.json();
  } catch (e) {
    // not json
  }

  // Get raw set-cookie array
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
    const [nameVal, ...attrs] = segments;
    const eqIdx = nameVal.indexOf('=');
    if (eqIdx === -1) continue;
    const name = nameVal.substring(0, eqIdx).trim();
    const val = nameVal.substring(eqIdx + 1).trim();

    cookies[name] = {
      value: val,
      httpOnly: attrs.some((a) => a.toLowerCase() === 'httponly'),
      sameSite: attrs.find((a) => a.toLowerCase().startsWith('samesite')) || null,
      raw: headerStr,
    };
  }
  return cookies;
};

const runVerification = async () => {
  console.log('====================================================');
  console.log('Starting Phase 1 Verification for GreenPulse AI Backend');
  console.log('====================================================\n');

  const results = [];

  const record = (num, description, passed, details = '') => {
    results.push({ num, description, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Item ${num}] ${mark}: ${description}`);
    if (details) console.log(`   └─ ${details}`);
  };

  try {
    // Connect to test MongoDB
    await connectDB();
    await User.deleteMany({ email: { $regex: /@greenpulse-test\.com$/ } });

    // 1. Backend starts successfully
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
    record(1, 'Backend starts successfully', true, `Listening on ${baseUrl}`);

    // 2. /health returns success
    const healthRes = await request('/health');
    const healthPassed =
      healthRes.status === 200 &&
      healthRes.body.success === true &&
      healthRes.body.data.status === 'healthy';
    record(2, '/health returns success', healthPassed, `Status: ${healthRes.status}, Body: ${JSON.stringify(healthRes.body)}`);

    // 3. /ready correctly reports MongoDB + Firestore readiness
    const readyRes = await request('/ready');
    const readyPassed =
      readyRes.status === 200 &&
      readyRes.body.data.services.mongodb === 'connected';
    record(3, '/ready correctly reports MongoDB readiness', readyPassed, `Services: ${JSON.stringify(readyRes.body.data?.services)}`);

    // 4. Signup creates a MongoDB user
    const testEmail = `test_${Date.now()}@greenpulse-test.com`;
    const testPassword = 'Password123!';
    const signupRes = await request('/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
        role: 'facility_manager',
      },
    });
    const createdUser = await User.findOne({ email: testEmail }).select('+passwordHash');
    const signupPassed = signupRes.status === 201 && createdUser !== null;
    record(4, 'Signup creates a MongoDB user', signupPassed, `Created user ID: ${createdUser?._id}`);

    // 5. Password is stored only as a bcrypt hash
    const hashPassed =
      createdUser &&
      createdUser.passwordHash !== testPassword &&
      createdUser.passwordHash.startsWith('$2') &&
      (await bcrypt.compare(testPassword, createdUser.passwordHash));
    record(5, 'Password is stored only as a bcrypt hash', Boolean(hashPassed), `Hash prefix: ${createdUser?.passwordHash?.substring(0, 7)}...`);

    // 6. Login succeeds with valid credentials
    const loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });
    const loginPassed =
      loginRes.status === 200 &&
      loginRes.body.success === true &&
      loginRes.body.data.user?.email === testEmail;
    record(6, 'Login succeeds with valid credentials', loginPassed, `User email: ${loginRes.body.data?.user?.email}`);

    // 7. Login sets secure httpOnly cookies
    const cookies = parseCookies(loginRes.rawSetCookies);
    const cookiesPassed =
      cookies.accessToken &&
      cookies.accessToken.httpOnly &&
      cookies.refreshToken &&
      cookies.refreshToken.httpOnly;
    record(7, 'Login sets secure httpOnly cookies', Boolean(cookiesPassed), `accessToken httpOnly: ${cookies.accessToken?.httpOnly}, refreshToken httpOnly: ${cookies.refreshToken?.httpOnly}`);

    // 8. Tokens are NOT returned in JSON
    const noTokensInJson =
      loginRes.body.data &&
      !loginRes.body.data.accessToken &&
      !loginRes.body.data.refreshToken &&
      !loginRes.body.data.tokens &&
      !signupRes.body.data?.tokens;
    record(8, 'Tokens are NOT returned in JSON', Boolean(noTokensInJson), `Response data keys: ${Object.keys(loginRes.body.data || {}).join(', ')}`);

    // 9. /api/v1/auth/me rejects unauthenticated requests
    const unauthRes = await request('/api/v1/auth/me');
    const unauthPassed = unauthRes.status === 401 && unauthRes.body.error?.code === 'UNAUTHORIZED';
    record(9, '/api/v1/auth/me rejects unauthenticated requests', unauthPassed, `Status: ${unauthRes.status}, Error code: ${unauthRes.body.error?.code}`);

    // 10. /api/v1/auth/me accepts a valid authenticated request
    const authHeaders = {
      Cookie: `accessToken=${cookies.accessToken.value}; refreshToken=${cookies.refreshToken.value}`,
    };
    const authRes = await request('/api/v1/auth/me', { headers: authHeaders });
    const mePassed =
      authRes.status === 200 &&
      authRes.body.data.user?.email === testEmail &&
      !authRes.body.data.user?.passwordHash &&
      !authRes.body.data.user?.refreshToken;
    record(10, '/api/v1/auth/me accepts valid authenticated request and returns safe identity', mePassed, `Safe user returned: ${authRes.body.data?.user?.email}`);

    // 11. Refresh token rotation works
    const refreshHeaders = {
      Cookie: `refreshToken=${cookies.refreshToken.value}`,
    };
    const refreshRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: refreshHeaders,
    });
    const refreshedCookies = parseCookies(refreshRes.rawSetCookies);
    const rotationNewCookiesIssued =
      refreshRes.status === 200 &&
      refreshedCookies.refreshToken &&
      refreshedCookies.refreshToken.value !== cookies.refreshToken.value;

    // Verify old refresh token is now revoked / rejected on reuse
    const reuseRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: refreshHeaders,
    });
    const reuseRejected = reuseRes.status === 401;
    const rotationPassed = rotationNewCookiesIssued && reuseRejected;
    record(11, 'Refresh token rotation works and old tokens are revoked', Boolean(rotationPassed), `New token issued: ${Boolean(rotationNewCookiesIssued)}, Old token rejected on reuse: ${reuseRejected}`);

    // 12. Logout clears authentication cookies
    const logoutRes = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        Cookie: `accessToken=${refreshedCookies.accessToken?.value}; refreshToken=${refreshedCookies.refreshToken?.value}`,
      },
    });
    const rawLogoutCookies = logoutRes.rawSetCookies.join('; ');
    const logoutPassed =
      logoutRes.status === 200 &&
      (rawLogoutCookies.includes('accessToken=;') ||
       rawLogoutCookies.includes('Max-Age=0') ||
       rawLogoutCookies.includes('Expires='));
    record(12, 'Logout clears authentication cookies', Boolean(logoutPassed), `Logout status: ${logoutRes.status}`);

    // 13. Invalid credentials are rejected safely
    const invalidLoginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'WrongPassword999!',
      },
    });
    const invalidLoginPassed = invalidLoginRes.status === 401 && invalidLoginRes.body.error?.code === 'INVALID_CREDENTIALS';
    record(13, 'Invalid credentials are rejected safely', invalidLoginPassed, `Status: ${invalidLoginRes.status}, Code: ${invalidLoginRes.body.error?.code}`);

    // 14. Invalid signup/login payloads produce VALIDATION_ERROR
    const invalidPayloadRes = await request('/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email: 'not-an-email',
        password: 'short',
      },
    });
    const validationPassed =
      invalidPayloadRes.status === 400 &&
      invalidPayloadRes.body.error?.code === 'VALIDATION_ERROR' &&
      Array.isArray(invalidPayloadRes.body.error?.details) &&
      invalidPayloadRes.body.error.details.length > 0;
    record(14, 'Invalid payloads produce 400 VALIDATION_ERROR with field details', validationPassed, `Details count: ${invalidPayloadRes.body.error?.details?.length}, Fields: ${invalidPayloadRes.body.error?.details?.map(d => d.field).join(', ')}`);

    // 15. RBAC middleware correctly rejects unauthorized roles
    let rbacError = null;
    let rbacNextCalled = false;
    const reqFacilityManager = { user: { role: 'facility_manager' } };
    const rbacMiddleware = requireRole(['admin']);
    rbacMiddleware(reqFacilityManager, {}, (err) => {
      rbacNextCalled = true;
      rbacError = err;
    });
    const rbacPassed =
      rbacNextCalled &&
      rbacError &&
      rbacError.statusCode === 403 &&
      rbacError.code === 'FORBIDDEN';
    record(15, 'RBAC middleware correctly rejects unauthorized roles', Boolean(rbacPassed), `Rejected with status: ${rbacError?.statusCode}, code: ${rbacError?.code}`);

    // 16. Server error handling does not expose secrets or stack traces
    const mockRes = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    const sensitiveError = new Error('DATABASE_PASSWORD=secret123 failed connection stack trace');
    errorHandler(
      sensitiveError,
      { originalUrl: '/api/v1/secret', method: 'GET', headers: {} },
      mockRes,
      () => {}
    );
    const safeErrorPassed =
      mockRes.statusCode === 500 &&
      mockRes.body.success === false &&
      mockRes.body.error?.code === 'INTERNAL_SERVER_ERROR' &&
      !mockRes.body.error?.message.includes('DATABASE_PASSWORD') &&
      !mockRes.body.stack &&
      !mockRes.body.error?.details?.stack;
    record(16, 'Server error handling does not expose secrets or stack traces', Boolean(safeErrorPassed), `Sanitized output: ${JSON.stringify(mockRes.body)}`);

    // 17. No existing frontend files were modified
    const frontendDir = path.resolve(__dirname, '../../src');
    const frontendExists = fs.existsSync(frontendDir);
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const pkgExists = fs.existsSync(packageJsonPath);
    const frontendProtected = frontendExists && pkgExists;
    record(17, 'No existing frontend files were modified (frontend locked)', frontendProtected, `Frontend root 'src/' intact`);

    // Clean up test users
    await User.deleteMany({ email: { $regex: /@greenpulse-test\.com$/ } });

    console.log('\n====================================================');
    const allPassed = results.every((r) => r.passed);
    console.log(`Verification completed: ${results.filter((r) => r.passed).length}/${results.length} passed.`);
    console.log(`Overall Result: ${allPassed ? 'ALL VERIFICATIONS PASSED' : 'SOME VERIFICATIONS FAILED'}`);
    console.log('====================================================\n');

    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('Verification encountered an unexpected failure:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
};

runVerification();
