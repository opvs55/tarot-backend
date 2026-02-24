import { env } from '../config/env.js';

export const devAuthMock = (req, _res, next) => {
  if (env.nodeEnv !== 'production') {
    const mockUserId = req.header('x-dev-user-id');
    if (mockUserId) req.user = { id: mockUserId };
  }
  // TODO: remover este middleware após concluir autenticação JWT completa.
  next();
};
