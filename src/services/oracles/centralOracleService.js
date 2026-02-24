import { resolveWeekStart, toWeekRef } from '../../utils/dateWeek.js';
import { moduleRunnerService } from '../modules/moduleRunnerService.js';
import { synthesisAiService } from './synthesisAiService.js';
import { unifiedReadingRepository } from '../../repositories/unifiedReadingRepository.js';

const DEFAULT_MODULES = ['tarot_weekly', 'numerology_weekly', 'natal_snapshot'];

export const centralOracleService = {
  async generateWeeklyUnifiedReading({ userId, weekStart: inputWeekStart, forceRegenerate = false, autoGenerateMissing = true, modules = DEFAULT_MODULES, focusArea = null }) {
    const weekStart = resolveWeekStart(inputWeekStart);
    const weekRef = toWeekRef(weekStart);

    const run = await moduleRunnerService.runWeeklyModules({ userId, weekStart, weekRef, modules, autoGenerateMissing, forceRegenerate });

    const inputsSnapshot = { week_start: weekStart, week_ref: weekRef, force_regenerate: forceRegenerate, focus_area: focusArea };
    const modulesSnapshot = run.results;
    const finalReading = await synthesisAiService.generateUnifiedReading({ inputsSnapshot, modulesSnapshot });

    const unified = await unifiedReadingRepository.upsertUnifiedReading({
      user_id: userId,
      week_start: weekStart,
      week_ref: weekRef,
      inputs_snapshot: inputsSnapshot,
      modules_snapshot: modulesSnapshot,
      final_reading: finalReading,
      energy_score: finalReading.energy_score,
      tags: finalReading.tags,
    });

    return { unified, partial: run.partial, errors: run.errors };
  },
};
