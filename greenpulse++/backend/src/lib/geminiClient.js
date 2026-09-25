const { GoogleGenAI, Type } = require('@google/genai');
const env = require('../config/env');
const logger = require('./logger');
const { buildRecommendationPrompt } = require('./recommendationPrompt');
const { geminiResponseSchema } = require('../modules/recommendations/recommendation.validator');

// Singleton Google GenAI client instance
let aiClientInstance = null;

const getAiClient = () => {
  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClientInstance;
};

// Response schema declaration for gemini-2.5-flash
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: [
              'energy_efficiency',
              'waste_reduction',
              'renewable_transition',
              'operational_optimization',
            ],
          },
          estimatedCostSavingsINR: { type: Type.NUMBER },
          estimatedCO2ReductionKg: { type: Type.NUMBER },
          implementationEffort: {
            type: Type.STRING,
            enum: ['low', 'medium', 'high'],
          },
          geminiImpactScore: { type: Type.NUMBER },
        },
        required: [
          'action',
          'category',
          'estimatedCostSavingsINR',
          'estimatedCO2ReductionKg',
          'implementationEffort',
          'geminiImpactScore',
        ],
      },
    },
  },
  required: ['recommendations'],
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute a single Gemini API call with 10-second timeout
 * @param {object} promptPayload
 * @param {number} timeoutMs
 */
const callGeminiOnce = async (promptPayload, timeoutMs = 10000) => {
  const ai = getAiClient();
  const { systemInstruction, userPrompt } = promptPayload;

  const apiCallPromise = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.2, // Low temperature for deterministic output
    },
  });

  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini call timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    timer.unref();
  });

  const response = await Promise.race([apiCallPromise, timeoutPromise]);
  const text = response?.text;

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON response: ${err.message}`);
  }

  const validation = geminiResponseSchema.safeParse(parsedJson);
  if (!validation.success) {
    const errorDetails = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Zod validation failed: ${errorDetails}`);
  }

  return validation.data.recommendations;
};

/**
 * Call Gemini with exactly one automatic retry (max 2 attempts total)
 * @param {object} params
 * @param {object} params.sourceContext
 * @param {string} params.companyId
 * @param {string} params.jobId
 */
const generateRecommendationsWithRetry = async ({ sourceContext, companyId, jobId }) => {
  const companyIdStr = companyId.toString();
  const jobIdStr = jobId.toString();
  const promptPayload = buildRecommendationPrompt(sourceContext);

  // Attempt 1
  try {
    logger.info({ jobId: jobIdStr, companyId: companyIdStr, attempt: 1 }, 'Gemini recommendation generation attempt 1');
    const recommendations = await callGeminiOnce(promptPayload, 10000);
    logger.info(
      { jobId: jobIdStr, companyId: companyIdStr, attempt: 1, count: recommendations.length },
      'Gemini recommendation generation attempt 1 succeeded'
    );
    return { success: true, recommendations };
  } catch (err1) {
    logger.warn(
      { jobId: jobIdStr, companyId: companyIdStr, attempt: 1, err: err1.message },
      'Gemini attempt 1 failed; triggering automatic retry (attempt 2)'
    );

    // Grace period before retry
    await delay(500);

    // Attempt 2 (Final allowed retry)
    try {
      logger.info({ jobId: jobIdStr, companyId: companyIdStr, attempt: 2 }, 'Gemini recommendation generation attempt 2 (final)');
      const recommendations = await callGeminiOnce(promptPayload, 10000);
      logger.info(
        { jobId: jobIdStr, companyId: companyIdStr, attempt: 2, count: recommendations.length },
        'Gemini recommendation generation attempt 2 succeeded'
      );
      return { success: true, recommendations };
    } catch (err2) {
      logger.error(
        { jobId: jobIdStr, companyId: companyIdStr, attempt: 2, err: err2.message },
        'Gemini attempt 2 failed; recommendation generation unavailable this cycle'
      );
      return { success: false, reason: 'recommendations unavailable this cycle' };
    }
  }
};

module.exports = {
  getAiClient,
  generateRecommendationsWithRetry,
  callGeminiOnce,
};
