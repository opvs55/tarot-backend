import { ok } from '../utils/apiResponse.js';
import { parseSchema } from '../validators/commonSchemas.js';
import { centralOracleSchema, weekOnlySchema } from '../validators/oracleSchemas.js';
import { resolveWeekStart, toWeekRef } from '../utils/dateWeek.js';
import { tarotWeeklyService } from '../services/oracles/tarotWeeklyService.js';
import { numerologyBaseService } from '../services/oracles/numerologyBaseService.js';
import { numerologyWeeklyService } from '../services/oracles/numerologyWeeklyService.js';
import { natalSnapshotService } from '../services/natal/natalSnapshotService.js';
import { oracleWeeklyModuleRepository } from '../repositories/oracleWeeklyModuleRepository.js';
import { centralOracleService } from '../services/oracles/centralOracleService.js';

// Exemplo body: {"week_start":"2026-02-23","force_regenerate":false}
export const generateTarotWeekly = async (req, res, next) => {
  try {
    const payload = parseSchema(weekOnlySchema, req.body);
    const weekStart = resolveWeekStart(payload.week_start);
    const weekRef = toWeekRef(weekStart);
    const data = await tarotWeeklyService.generate({ userId: req.user.id, weekStart, weekRef, forceRegenerate: payload.force_regenerate });
    return ok(res, data, {}, 201);
  } catch (error) { return next(error); }
};

export const generateNumerologyBase = async (req, res, next) => {
  try {
    const data = await numerologyBaseService.generate({ userId: req.user.id, payload: req.body || {} });
    return ok(res, data, {}, 201);
  } catch (error) { return next(error); }
};

export const generateNumerologyWeekly = async (req, res, next) => {
  try {
    const payload = parseSchema(weekOnlySchema, req.body);
    const weekStart = resolveWeekStart(payload.week_start);
    const weekRef = toWeekRef(weekStart);
    const data = await numerologyWeeklyService.generate({ userId: req.user.id, weekStart, weekRef, forceRegenerate: payload.force_regenerate });
    return ok(res, data, {}, 201);
  } catch (error) { return next(error); }
};

export const generateNatalSnapshotWeekly = async (req, res, next) => {
  try {
    const payload = parseSchema(weekOnlySchema, req.body);
    const weekStart = resolveWeekStart(payload.week_start);
    const weekRef = toWeekRef(weekStart);
    const output = await natalSnapshotService.generate({ userId: req.user.id, weekStart, weekRef });
    const data = await oracleWeeklyModuleRepository.upsertModule(req.user.id, weekStart, weekRef, 'natal_snapshot', {
      input_payload: { week_start: weekStart, week_ref: weekRef },
      output_payload: output,
      status: 'success',
      error_message: null,
      model_meta: { source: 'natal-snapshot-v1' },
    });
    return ok(res, data, {}, 201);
  } catch (error) { return next(error); }
};

// Exemplo resposta: { success:true, data:{ unified:{...}, partial:false, errors:[] } }
export const generateCentralWeekly = async (req, res, next) => {
  try {
    const payload = parseSchema(centralOracleSchema, req.body);
    const data = await centralOracleService.generateWeeklyUnifiedReading({
      userId: req.user.id,
      weekStart: payload.week_start,
      forceRegenerate: payload.force_regenerate,
      autoGenerateMissing: payload.auto_generate_missing,
      modules: payload.modules,
      focusArea: payload.focus_area,
    });
    return ok(res, data, {}, 201);
  } catch (error) { return next(error); }
};
