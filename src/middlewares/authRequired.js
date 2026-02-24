import { AppError } from '../utils/appError.js';

export const authRequired = (req, _res, next) => {
  if (!req.user?.id) {
    return next(new AppError('Autenticação obrigatória.', { status: 401, code: 'AUTH_REQUIRED' }));
  }
  return next();
};
