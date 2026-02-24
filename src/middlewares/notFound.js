import { fail } from '../utils/apiResponse.js';

export const notFound = (req, res) => fail(res, 404, 'NOT_FOUND', `Rota não encontrada: ${req.method} ${req.originalUrl}`);
