import { AppError } from '../shared/http/AppError.js';
import { ERROR_CODES } from '../shared/http/errorCodes.js';

export const requireFields = (body, requiredFields = []) => {
  const missing = requiredFields.filter((field) => body?.[field] === undefined || body?.[field] === null);

  if (missing.length > 0) {
    throw new AppError('Payload inválido.', {
      status: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: missing.map((field) => ({ field, message: 'Campo obrigatório.' })),
    });
  }
};
