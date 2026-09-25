const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/modules/auth/user.model');
const Recommendation = require('../src/modules/recommendations/recommendation.model');
const UploadJob = require('../src/modules/upload/upload-job.model');
const Department = require('../src/modules/departments/department.model');
const recommendationService = require('../src/modules/recommendations/recommendation.service');

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ email: 'demo@greenpulse.ai' }).lean();
  if (!user || !user.company) {
    console.error('Demo user or company not found');
    process.exit(1);
  }

  const companyId = user.company;
  console.log('Found demo user company:', companyId);

  // Check existing recommendations
  const existingCount = await Recommendation.countDocuments({ companyId });
  if (existingCount > 0) {
    console.log(`Company already has ${existingCount} recommendations in DB.`);
    const sample = await Recommendation.find({ companyId }).lean();
    console.log('Sample:', sample.map(s => ({ id: s._id, action: s.action, priority: s.priorityScore, status: s.status })));
    await mongoose.disconnect();
    return;
  }

  // Get departments
  const depts = await Department.find({ companyId }).lean();
  const paintDept = depts.find(d => d.name.includes('Paint')) || depts[0] || { name: 'Paint & Coating Facility' };
  const pressDept = depts.find(d => d.name.includes('Press')) || depts[1] || { name: 'Press & Stamping Shop' };

  // Create a synthetic UploadJob for triggering context
  let job = await UploadJob.findOne({ companyId });
  if (!job) {
    job = await UploadJob.create({
      companyId,
      filename: 'apex_energy_telemetry_q3.csv',
      contentHash: 'demo-energy-telemetry-hash-' + Date.now(),
      fileType: 'energy',
      status: 'completed',
      rowCount: 48,
      processedCount: 48,
    });
  }

  const sourceContext = {
    triggeringJobId: job._id,
    carbonSummary: {
      totalKgCO2e: 142000,
      scope2KgCO2e: 112000,
    },
    anomalySummaries: [
      {
        departmentName: paintDept.name,
        period: '2026-08',
        deviationPercent: 42.5,
        severity: 'high',
      },
      {
        departmentName: pressDept.name,
        period: '2026-08',
        deviationPercent: 28.1,
        severity: 'medium',
      },
    ],
    greenScoreBreakdown: {
      overallScore: 68,
      energyEfficiencyScore: 62,
      complianceScore: 78,
    },
  };

  const rawRecommendations = [
    {
      action: 'Reschedule Paint Shop curing oven pre-heating to off-peak tariff window',
      category: 'energy_efficiency',
      estimatedCostSavingsINR: 85000,
      estimatedCO2ReductionKg: 620,
      implementationEffort: 'low',
      geminiImpactScore: 92,
    },
    {
      action: 'Install variable frequency drives (VFD) on Press Shop hydraulic cooling loops',
      category: 'operational_optimization',
      estimatedCostSavingsINR: 42000,
      estimatedCO2ReductionKg: 310,
      implementationEffort: 'medium',
      geminiImpactScore: 84,
    },
    {
      action: 'Execute 500kW rooftop solar PPA agreement for main manufacturing roof',
      category: 'renewable_transition',
      estimatedCostSavingsINR: 140000,
      estimatedCO2ReductionKg: 1200,
      implementationEffort: 'high',
      geminiImpactScore: 96,
    },
    {
      action: 'Implement closed-loop solvent recovery system in paint preparation line',
      category: 'waste_reduction',
      estimatedCostSavingsINR: 35000,
      estimatedCO2ReductionKg: 180,
      implementationEffort: 'medium',
      geminiImpactScore: 75,
    },
  ];

  const scoredItems = recommendationService.calculateBatchPriorityScores(rawRecommendations);
  const persisted = await recommendationService.persistScoredRecommendations({
    companyId,
    jobId: job._id,
    scoredItems,
    sourceContext,
  });

  console.log(`Successfully persisted ${persisted.length} real recommendations for demo company!`);
  for (const r of persisted) {
    console.log(`- [${r.status}] Priority: ${r.priorityScore} | Action: "${r.action}" | Est: ₹${r.estimatedImpact?.costSavingsINR}`);
  }

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
