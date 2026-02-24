import { ok } from '../utils/apiResponse.js';
import { profileService } from '../services/profiles/profileService.js';
import { parseSchema } from '../validators/commonSchemas.js';
import { upsertProfileSchema } from '../validators/profileSchemas.js';

export const upsertProfile = async (req, res, next) => {
  try {
    // Exemplo body: {"full_name":"Ana Clara","birth_date":"1991-03-10"}
    const payload = parseSchema(upsertProfileSchema, req.body);
    const data = await profileService.upsert(req.user.id, payload);
    return ok(res, data, {}, 201);
  } catch (error) {
    return next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const data = await profileService.getMe(req.user.id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
