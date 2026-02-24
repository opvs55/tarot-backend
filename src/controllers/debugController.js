import { ok } from '../utils/apiResponse.js';
import { moduleRunnerService } from '../services/modules/moduleRunnerService.js';
import { centralOracleService } from '../services/oracles/centralOracleService.js';

export const previewModules = async (req, res, next) => {
  try {
    const weekStart = req.body?.week_start || undefined;
    const result = await moduleRunnerService.runWeeklyModules({
      userId: req.user.id,
      weekStart: weekStart || new Date().toISOString().slice(0, 10),
      weekRef: req.body?.week_ref || 'preview',
      modules: req.body?.modules || ['tarot_weekly', 'numerology_weekly', 'natal_snapshot'],
      autoGenerateMissing: true,
      forceRegenerate: false,
    });
    return ok(res, result);
  } catch (error) { return next(error); }
};

export const previewCentral = async (req, res, next) => {
  try {
    const data = await centralOracleService.generateWeeklyUnifiedReading({ userId: req.user.id, ...req.body });
    return ok(res, data);
  } catch (error) { return next(error); }
};
