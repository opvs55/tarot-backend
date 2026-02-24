import { moduleRegistry } from './moduleRegistry.js';
import { oracleWeeklyModuleRepository } from '../../repositories/oracleWeeklyModuleRepository.js';

export const moduleRunnerService = {
  async runWeeklyModules({ userId, weekStart, weekRef, modules, autoGenerateMissing = true, forceRegenerate = false }) {
    const results = {};
    const errors = [];

    for (const moduleName of modules) {
      try {
        let moduleResult = null;
        if (!forceRegenerate) {
          moduleResult = await oracleWeeklyModuleRepository.findByUserWeekAndType(userId, weekRef, moduleName);
        }
        if (!moduleResult && autoGenerateMissing) {
          const handler = moduleRegistry[moduleName];
          if (!handler) throw new Error(`Módulo ${moduleName} não registrado.`);
          moduleResult = await handler({ userId, weekStart, weekRef, forceRegenerate });
        }
        if (!moduleResult) errors.push({ module: moduleName, error: 'Módulo ausente.' });
        results[moduleName] = moduleResult;
      } catch (error) {
        errors.push({ module: moduleName, error: error.message });
        results[moduleName] = null;
      }
    }

    return { results, errors, partial: errors.length > 0 };
  },
};
