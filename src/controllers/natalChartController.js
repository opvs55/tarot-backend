import { ok } from '../utils/apiResponse.js';
import { natalChartService } from '../services/natal/natalChartService.js';
import { natalRenderingService } from '../services/natal/natalRenderingService.js';
import { parseSchema } from '../validators/commonSchemas.js';
import { upsertNatalSchema } from '../validators/natalSchemas.js';

export const upsertNatalChart = async (req, res, next) => {
  try {
    const birthData = parseSchema(upsertNatalSchema, req.body);
    const data = await natalChartService.upsertNatalChart({ userId: req.user.id, birthData });
    return ok(res, data, {}, 201);
  } catch (error) {
    return next(error);
  }
};

export const getMyNatalChart = async (req, res, next) => {
  try {
    const data = await natalChartService.getNatalChart(req.user.id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const previewNatalChart = async (req, res, next) => {
  try {
    const payload = parseSchema(upsertNatalSchema, req.body);
    const data = await natalChartService.previewNatalChartCalculation(payload);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const renderNatalSvg = async (req, res, next) => {
  try {
    const svg = await natalRenderingService.getNatalChartSvg({ userId: req.user.id });
    res.setHeader('content-type', 'image/svg+xml');
    return res.status(200).send(svg);
  } catch (error) {
    return next(error);
  }
};
