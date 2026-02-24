import { sendSuccess } from '../shared/http/response.js';
import { generateTarotWeekly, generateNumerologyBase, generateNumerologyWeekly, runWeeklyModule } from '../services/oracleModulesService.js';
import { generateCentralWeeklyReading } from '../services/unifiedReadingsService.js';

export const generateTarotWeeklyController = async (req, res, next) => {
  try {
    const { week_start: weekStart, force_regenerate: forceRegenerate = false } = req.body || {};
    const data = await generateTarotWeekly({ userId: req.user.id, weekStart, forceRegenerate });
    return sendSuccess(res, { data, requestId: req.requestId, status: 201 });
  } catch (error) {
    return next(error);
  }
};

export const generateNumerologyBaseController = async (req, res, next) => {
  try {
    const data = await generateNumerologyBase({ userId: req.user.id, payload: req.body || {} });
    return sendSuccess(res, { data, requestId: req.requestId, status: 201 });
  } catch (error) {
    return next(error);
  }
};

export const generateNumerologyWeeklyController = async (req, res, next) => {
  try {
    const { week_start: weekStart, force_regenerate: forceRegenerate = false } = req.body || {};
    const data = await generateNumerologyWeekly({ userId: req.user.id, weekStart, forceRegenerate });
    return sendSuccess(res, { data, requestId: req.requestId, status: 201 });
  } catch (error) {
    return next(error);
  }
};

export const generateNatalSnapshotWeeklyController = async (req, res, next) => {
  try {
    const { week_start: weekStart, force_regenerate: forceRegenerate = false } = req.body || {};
    const data = await runWeeklyModule({ userId: req.user.id, weekStart, forceRegenerate, oracleType: 'natal_snapshot' });
    return sendSuccess(res, { data, requestId: req.requestId, status: 201 });
  } catch (error) {
    return next(error);
  }
};

// Exemplo resposta central: { ok: true, data: { unified: {...}, warnings: [] } }
export const generateCentralWeeklyController = async (req, res, next) => {
  try {
    const {
      week_start: weekStart,
      force_regenerate: forceRegenerate = false,
      auto_generate_missing: autoGenerateMissing = true,
    } = req.body || {};

    const data = await generateCentralWeeklyReading({
      userId: req.user.id,
      weekStart,
      forceRegenerate,
      autoGenerateMissing,
    });

    return sendSuccess(res, { data, requestId: req.requestId, status: 201, warnings: data.warnings });
  } catch (error) {
    return next(error);
  }
};

export const previewModulesController = async (req, res, next) => {
  try {
    const data = {
      payload: req.body,
      preview: {
        tarot_weekly: { status: 'success' },
        numerology_weekly: { status: 'success' },
        natal_snapshot: { status: 'success' },
      },
    };
    return sendSuccess(res, { data, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
};

export const previewCentralController = async (req, res, next) => {
  try {
    const data = {
      payload: req.body,
      preview: {
        final_reading: 'Prévia do oráculo central.',
        energy_score: 70,
        tags: ['preview'],
      },
    };
    return sendSuccess(res, { data, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
};
