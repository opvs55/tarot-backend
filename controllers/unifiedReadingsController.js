import { AppError } from '../shared/http/AppError.js';
import { ERROR_CODES } from '../shared/http/errorCodes.js';
import { sendSuccess } from '../shared/http/response.js';
import { getMyUnifiedReadings, getUnifiedById } from '../services/unifiedReadingsService.js';

export const getUnifiedReadingsMeController = async (req, res, next) => {
  try {
    const data = await getMyUnifiedReadings(req.user.id);
    return sendSuccess(res, { data, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
};

export const getUnifiedReadingByIdController = async (req, res, next) => {
  try {
    const data = await getUnifiedById(req.user.id, req.params.id);
    if (!data) {
      throw new AppError('Leitura não encontrada.', { status: 404, code: ERROR_CODES.NOT_FOUND });
    }
    return sendSuccess(res, { data, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
};
