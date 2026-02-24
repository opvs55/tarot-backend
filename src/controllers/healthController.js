import { ok } from '../utils/apiResponse.js';
import { supabaseHealthCheck } from '../integrations/supabaseClient.js';
import { geminiClient } from '../integrations/geminiClient.js';
import { astrologyProviderClient } from '../integrations/astrologyProviderClient.js';

export const health = (_req, res) => ok(res, { status: 'ok' });

export const ready = async (_req, res, next) => {
  try {
    const [supabase, gemini, astrology] = await Promise.all([
      supabaseHealthCheck(),
      geminiClient.healthCheck(),
      astrologyProviderClient.healthCheck(),
    ]);
    return ok(res, { status: 'ready', checks: { supabase, gemini, astrology } });
  } catch (error) {
    return next(error);
  }
};
