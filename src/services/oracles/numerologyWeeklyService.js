import { numerologyRepository } from '../../repositories/numerologyRepository.js';
import { oracleWeeklyModuleRepository } from '../../repositories/oracleWeeklyModuleRepository.js';

export const numerologyWeeklyService = {
  async generate({ userId, weekStart, weekRef, forceRegenerate = false }) {
    if (!forceRegenerate) {
      const existing = await oracleWeeklyModuleRepository.findByUserWeekAndType(userId, weekRef, 'numerology_weekly');
      if (existing?.status === 'success') return existing;
    }

    const output = { personal_week_number: 4, recommendation: 'Organize e conclua tarefas prioritárias.' };
    await numerologyRepository.upsertWeeklyReading(userId, weekStart, weekRef, output);

    return oracleWeeklyModuleRepository.upsertModule(userId, weekStart, weekRef, 'numerology_weekly', {
      input_payload: { week_start: weekStart, week_ref: weekRef },
      output_payload: output,
      status: 'success',
      error_message: null,
      model_meta: { source: 'numerology-engine-v1' },
    });
  },
};
