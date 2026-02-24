import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

app.listen(env.port, '0.0.0.0', () => {
  logger.info(`Oráculo IA backend booted on port ${env.port}`);
});
