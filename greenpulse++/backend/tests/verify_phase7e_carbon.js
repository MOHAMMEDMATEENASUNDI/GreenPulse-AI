/**
 * GreenPulse AI — Phase 7E Carbon Intelligence Verification Suite
 */

process.env.NODE_ENV = 'test';

const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/modules/auth/user.model');
const Company = require('../src/modules/companies/company.model');
const Department = require('../src/modules/departments/department.model');
const EnergyRecord = require('../src/modules/upload/energy-record.model');
const Emission = require('../src/modules/carbon/emission.model');
const { recalculateEmissionsForCompany } = require('../src/modules/carbon/carbon.service');

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
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let body = {};
  try {
    body = await res.json();
  } catch (e) {}

  const rawSetCookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean);

  return { status: res.status, headers: res.headers, body, rawSetCookies };
};

const extractCookie = (setCookieHeaders, cookieName = 'accessToken') => {
  for (const header of setCookieHeaders) {
    const match = header.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
};

async function runTests() {
  console.log('====================================================');
  console.log('🌿 GREENPULSE AI — PHASE 7E CARBON VERIFICATION');
  console.log('====================================================\n');

  await connectDB();

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
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
    const suffix = Date.now().toString().slice(-6);

    // 1. Create Test Company with Multiple Departments and Real Historical Telemetry
    const company = await Company.create({
      name: `Carbon Test Corp ${suffix}`,
      industry: 'Manufacturing',
      employeeCount: 300,
      annualRevenueINR: 60000000,
    });

    const user = await User.create({
      company: company._id,
      email: `carbon.lead.${suffix}@testcorp.com`,
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'facility_manager',
    });

    const deptPaint = await Department.create({
      companyId: company._id,
      name: 'Paint & Coating Facility',
      normalizedName: 'paint & coating facility',
      facilityType: 'production',
    });

    const deptPress = await Department.create({
      companyId: company._id,
      name: 'Press & Stamping Shop',
      normalizedName: 'press & stamping shop',
      facilityType: 'operations',
    });

    // Ingest Energy Records across 2 periods (2026-07 and 2026-08)
    const testHash = `test-hash-${suffix}`;
    await EnergyRecord.create([
      { companyId: company._id, departmentId: deptPaint._id, period: '2026-07', kwhUsed: 50000, sourceFileHash: testHash },
      { companyId: company._id, departmentId: deptPress._id, period: '2026-07', kwhUsed: 30000, sourceFileHash: testHash },
      { companyId: company._id, departmentId: deptPaint._id, period: '2026-08', kwhUsed: 55000, sourceFileHash: testHash },
      { companyId: company._id, departmentId: deptPress._id, period: '2026-08', kwhUsed: 28000, sourceFileHash: testHash },
    ]);

    // Recalculate Emissions
    await recalculateEmissionsForCompany(company._id);

    // Login user
    const loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { email: user.email, password: 'Password123!' },
    });
    const cookie = extractCookie(loginRes.rawSetCookies, 'accessToken');
    const authHeaders = { Cookie: `accessToken=${cookie}` };

    console.log('\n--- 1. Carbon Summary Endpoint Verification ---');
    const summaryRes = await request('/api/v1/carbon/summary', { headers: authHeaders });
    assert(summaryRes.status === 200, 'GET /api/v1/carbon/summary returns 200 OK');

    const data = summaryRes.body.data;
    assert(Boolean(data), 'Response contains data payload');
    assert(data.factorVersion === 'CEA-2025.1', `Factor version matches CEA-2025.1 (got: ${data.factorVersion})`);

    // Total Scope 2: (50000 + 30000 + 55000 + 28000) * 0.82 = 163000 * 0.82 = 133660 kg CO2e
    assert(data.totalKgCO2e === 133660, `Total kg CO2e is 133,660 kg (got: ${data.totalKgCO2e})`);
    assert(data.totalKwh === 163000, `Total kWh is 163,000 kWh (got: ${data.totalKwh})`);

    // Scopes Honest Verification
    console.log('\n--- 2. Scope Honesty Verification ---');
    assert(data.scopes.scope1.value === null, 'Scope 1 value is strictly null');
    assert(data.scopes.scope1.dataAvailable === false, 'Scope 1 dataAvailable is false');
    assert(Boolean(data.scopes.scope1.reason), `Scope 1 provides clear reason: "${data.scopes.scope1.reason}"`);

    assert(data.scopes.scope2.value > 0, `Scope 2 has real value: ${data.scopes.scope2.value} kg CO2e`);
    assert(data.scopes.scope2.dataAvailable === true, 'Scope 2 dataAvailable is true');

    assert(data.scopes.scope3.value === null, 'Scope 3 value is strictly null');
    assert(data.scopes.scope3.dataAvailable === false, 'Scope 3 dataAvailable is false');
    assert(Boolean(data.scopes.scope3.reason), `Scope 3 provides clear reason: "${data.scopes.scope3.reason}"`);

    // Periods History Verification
    console.log('\n--- 3. Historical Periods Verification ---');
    assert(data.periods.length === 2, `Contains 2 periods (got: ${data.periods.length})`);
    const period08 = data.periods.find((p) => p.period === '2026-08');
    const period07 = data.periods.find((p) => p.period === '2026-07');
    assert(Boolean(period08) && Boolean(period07), 'Contains both 2026-07 and 2026-08');
    assert(period08.co2eScope2 === 68060, `2026-08 Scope 2 is 68,060 kg ((55k + 28k) * 0.82)`);
    assert(period07.co2eScope2 === 65600, `2026-07 Scope 2 is 65,600 kg ((50k + 30k) * 0.82)`);

    // Department Breakdown Verification
    console.log('\n--- 4. Department Carbon Accounting Breakdown Verification ---');
    assert(data.departmentBreakdown.length === 2, `Contains 2 departments (got: ${data.departmentBreakdown.length})`);
    const paintBreakdown = data.departmentBreakdown.find((d) => d.departmentId === deptPaint._id.toString());
    assert(Boolean(paintBreakdown), 'Paint & Coating Facility is present in breakdown');
    assert(paintBreakdown.departmentName === 'Paint & Coating Facility', 'Department name matches display title');
    assert(paintBreakdown.kwhUsed === 105000, `Paint Facility kWh is 105,000 (got: ${paintBreakdown.kwhUsed})`);
    assert(paintBreakdown.totalCo2e === 86100, `Paint Facility Scope 2 is 86,100 kg (got: ${paintBreakdown.totalCo2e})`);

    // Department Drill-Down Verification with MongoDB ObjectId
    console.log('\n--- 5. Department Drill-Down with MongoDB ObjectId ---');
    const drillDownRes = await request(`/api/v1/carbon/departments/${deptPaint._id}`, { headers: authHeaders });
    assert(drillDownRes.status === 200, 'GET /api/v1/carbon/departments/:id returns 200 OK');
    const drillData = drillDownRes.body.data;
    assert(drillData.department.id === deptPaint._id.toString(), 'Returned department id matches ObjectId');
    assert(drillData.department.name === 'Paint & Coating Facility', 'Department name matches');
    assert(drillData.totalKgCO2e === 86100, 'Department drill-down total emissions matches');
    assert(drillData.history.length === 2, 'Department history has 2 periods');
    assert(drillData.scopes.scope1.value === null, 'Department Scope 1 is null (honest)');
    assert(drillData.scopes.scope3.value === null, 'Department Scope 3 is null (honest)');

    // Invalid ObjectId 404 check
    const invalidId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(`/api/v1/carbon/departments/${invalidId}`, { headers: authHeaders });
    assert(notFoundRes.status === 404, 'Unknown department returns 404 NOT_FOUND');

    // Energy Usage Telemetry API
    console.log('\n--- 6. Energy Usage Activity Telemetry ---');
    const energyRes = await request('/api/v1/energy/usage', { headers: authHeaders });
    assert(energyRes.status === 200, 'GET /api/v1/energy/usage returns 200 OK');
    assert(energyRes.body.data.usage.length === 4, `Returns 4 telemetry records (got: ${energyRes.body.data.usage.length})`);

    console.log('\n====================================================');
    console.log(`📊 PHASE 7E CARBON TEST SUMMARY`);
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
