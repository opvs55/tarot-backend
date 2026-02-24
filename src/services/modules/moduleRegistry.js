import { tarotWeeklyService } from '../oracles/tarotWeeklyService.js';
import { numerologyWeeklyService } from '../oracles/numerologyWeeklyService.js';
import { natalSnapshotService } from '../natal/natalSnapshotService.js';
import { oracleWeeklyModuleRepository } from '../../repositories/oracleWeeklyModuleRepository.js';

export const moduleRegistry = {
  tarot_weekly: async (ctx) => tarotWeeklyService.generate(ctx),
  numerology_weekly: async (ctx) => numerologyWeeklyService.generate(ctx),
  natal_snapshot: async (ctx) => {
    const output = await natalSnapshotService.generate(ctx);
    return oracleWeeklyModuleRepository.upsertModule(ctx.userId, ctx.weekStart, ctx.weekRef, 'natal_snapshot', {
      input_payload: { week_start: ctx.weekStart, week_ref: ctx.weekRef },
      output_payload: output,
      status: 'success',
      error_message: null,
      model_meta: { source: 'natal-snapshot-v1' },
    });
  },
};
