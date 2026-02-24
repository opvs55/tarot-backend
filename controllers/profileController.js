import { sendSuccess } from '../shared/http/response.js';
import { requireFields } from '../middlewares/validatePayload.js';
import { getMyProfile, upsertProfile } from '../services/profilesService.js';

export const upsertMyProfile = async (req, res, next) => {
  try {
    // Exemplo payload: { "full_name": "Ana", "birth_date": "1990-01-10" }
    requireFields(req.body, ['full_name']);
    const data = await upsertProfile(req.user.id, req.body);
    return sendSuccess(res, { data, requestId: req.requestId, status: 201 });
  } catch (error) {
    return next(error);
  }
};

export const getProfileMe = async (req, res, next) => {
  try {
    const data = await getMyProfile(req.user.id);
    return sendSuccess(res, { data, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
};
