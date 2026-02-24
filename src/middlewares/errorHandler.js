import { fail } from '../utils/apiResponse.js';

export const errorHandler = (error, req, res, _next) => {
  const status = error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Erro interno.';
  const details = error.details || [];
  return fail(res, status, code, message, details, { requestId: req.requestId });
};
