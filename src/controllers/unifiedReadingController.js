import { ok } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { unifiedReadingService } from '../services/unified/unifiedReadingService.js';

export const getMyUnifiedReadings = async (req, res, next) => {
  try {
    const data = await unifiedReadingService.listByUser(req.user.id);
    return ok(res, data);
  } catch (error) { return next(error); }
};

export const getUnifiedReadingById = async (req, res, next) => {
  try {
    const data = await unifiedReadingService.getByIdForUser(req.params.id, req.user.id);
    if (!data) throw new AppError('Leitura não encontrada.', { status: 404, code: 'NOT_FOUND' });
    return ok(res, data);
  } catch (error) { return next(error); }
};
