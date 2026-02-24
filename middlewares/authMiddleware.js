import { AppError } from '../shared/http/AppError.js';
import { ERROR_CODES } from '../shared/http/errorCodes.js';

export const authMiddleware = (req, _res, next) => {
  // TODO: remover bypass de desenvolvimento e substituir por validação JWT real.
  const devUserId = req.header('x-dev-user-id');

  if (devUserId) {
    req.user = { id: devUserId };
    return next();
  }

  if (!req.user?.id) {
    return next(new AppError('Usuário não autenticado.', { status: 401, code: ERROR_CODES.AUTH_REQUIRED }));
  }

  return next();
};
