import { sendSuccess } from '../shared/http/response.js';
import { requireFields } from '../middlewares/validatePayload.js';
import { getMyNatalChart, upsertNatalChart } from '../services/natalChartService.js';

export const upsertMyNatalChart = async (req, res, next) => {
  try {
    // Exemplo payload: { "birth_date": "1994-08-22", "birth_time": "14:35", "birth_city": "Lisboa" }
    requireFields(req.body, ['birth_date', 'birth_city']);
    const data = await upsertNatalChart(req.user.id, req.body);
    return sendSuccess(res, { data, requestId: req.requestId, status: 201 });
  } catch (error) {
    return next(error);
  }
};

export const getNatalChartMe = async (req, res, next) => {
  try {
    const data = await getMyNatalChart(req.user.id);
    return sendSuccess(res, { data, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
};
