/**
 * GreenPulse AI - Reference Data Seeder Script
 * Idempotent seeder: populates emissionFactors and complianceRubric collections in MongoDB.
 * Does not manage or interact with the runtime in-memory cache.
 */

const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('./logger');
const EmissionFactor = require('../modules/carbon/emission-factor.model');
const ComplianceRubric = require('../modules/esg/compliance-rubric.model');

const COMPLIANCE_PRINCIPLES = [
  {
    principleNumber: 1,
    name: 'Ethics, Transparency & Accountability',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should conduct and govern themselves with integrity in a manner that is ethical, transparent and accountable.',
  },
  {
    principleNumber: 2,
    name: 'Safe & Sustainable Goods and Services',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should provide goods and services in a manner that is sustainable and safe.',
  },
  {
    principleNumber: 3,
    name: 'Employee Wellbeing (incl. value chain workers)',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should respect and promote the well-being of all employees, including those in their value chains.',
  },
  {
    principleNumber: 4,
    name: 'Stakeholder Interests',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should respect the interests of and be responsive to all their stakeholders.',
  },
  {
    principleNumber: 5,
    name: 'Human Rights',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should respect and promote human rights across operational spheres.',
  },
  {
    principleNumber: 6,
    name: 'Environment Protection & Restoration',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should respect and make efforts to protect and restore the environment.',
  },
  {
    principleNumber: 7,
    name: 'Responsible Public Policy Advocacy',
    framework: 'BRSR_NGRBC',
    description: 'Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent.',
  },
  {
    principleNumber: 8,
    name: 'Inclusive Growth & Equitable Development',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should promote inclusive growth and equitable development in surrounding communities.',
  },
  {
    principleNumber: 9,
    name: 'Engaging & Providing Value to Consumers',
    framework: 'BRSR_NGRBC',
    description: 'Businesses should engage with and provide value to their consumers in a responsible manner.',
  },
];

const EMISSION_FACTORS = [
  {
    region: 'India',
    type: 'grid_electricity',
    factorKgCO2ePerKwh: 0.82,
    version: 'CEA-2025.1',
  },
];

const seedReferenceData = async () => {
  let ownsConnection = false;
  try {
    if (mongoose.connection.readyState === 0) {
      ownsConnection = true;
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('Connected to MongoDB for reference data seeding');
    }

    // 1. Seed Emission Factors idempotently
    let seededFactors = 0;
    for (const factor of EMISSION_FACTORS) {
      const existing = await EmissionFactor.findOne({
        region: factor.region,
        type: factor.type,
        version: factor.version,
      });

      if (!existing) {
        await EmissionFactor.create(factor);
        seededFactors++;
      }
    }
    logger.info({ seededFactors, total: EMISSION_FACTORS.length }, 'Emission factors seeded/verified');

    // 2. Seed Compliance Rubric idempotently
    let seededRubrics = 0;
    for (const principle of COMPLIANCE_PRINCIPLES) {
      const existing = await ComplianceRubric.findOne({
        principleNumber: principle.principleNumber,
      });

      if (!existing) {
        await ComplianceRubric.create(principle);
        seededRubrics++;
      }
    }
    logger.info({ seededRubrics, total: COMPLIANCE_PRINCIPLES.length }, 'Compliance rubric seeded/verified');

    logger.info('Reference data seeding completed successfully');
    return { seededFactors, seededRubrics };
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to seed reference data');
    throw error;
  } finally {
    if (ownsConnection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Closed reference data seeding database connection');
    }
  }
};

if (require.main === module) {
  seedReferenceData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedReferenceData, COMPLIANCE_PRINCIPLES, EMISSION_FACTORS };
