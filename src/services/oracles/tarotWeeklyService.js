import { weeklyCardRepository } from '../../repositories/weeklyCardRepository.js';
import { oracleWeeklyModuleRepository } from '../../repositories/oracleWeeklyModuleRepository.js';

export const tarotWeeklyService = {
  async generate({ userId, weekStart, weekRef, forceRegenerate = false }) {
    if (!forceRegenerate) {
      const existing = await oracleWeeklyModuleRepository.findByUserWeekAndType(userId, weekRef, 'tarot_weekly');
      if (existing?.status === 'success') return existing;
    }

    const output = {
      cards: ['The Sun', 'The Star', 'Temperance'],
      guidance: 'Confie no ritmo da semana e mantenha presença.',
    };

    await weeklyCardRepository.upsertByUserWeek(userId, weekStart, weekRef, output);
    return oracleWeeklyModuleRepository.upsertModule(userId, weekStart, weekRef, 'tarot_weekly', {
      input_payload: { week_start: weekStart, week_ref: weekRef },
      output_payload: output,
      status: 'success',
      error_message: null,
      model_meta: { source: 'tarot-rule-engine-v1' },
    });
  },
};
