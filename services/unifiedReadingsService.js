import { supabase } from '../integrations/supabaseClient.js';
import { generateUnifiedReading } from './synthesisAiService.js';
import { getIsoWeekInfo } from './weekService.js';
import { getExistingModule, runWeeklyModule } from './oracleModulesService.js';

const MODULES = ['tarot_weekly', 'numerology_weekly', 'natal_snapshot'];

export const generateCentralWeeklyReading = async ({ userId, weekStart: inputWeekStart, forceRegenerate = false, autoGenerateMissing = true }) => {
  const { weekStart, weekRef } = getIsoWeekInfo(inputWeekStart);
  const modulesSnapshot = {};
  const failures = [];

  for (const oracleType of MODULES) {
    try {
      let moduleRow = await getExistingModule({ userId, oracleType, weekRef });
      if (!moduleRow || forceRegenerate) {
        if (autoGenerateMissing || forceRegenerate) {
          const generated = await runWeeklyModule({ userId, weekStart, forceRegenerate, oracleType });
          moduleRow = generated.module;
        }
      }

      if (!moduleRow) {
        failures.push({ oracle_type: oracleType, error: 'Módulo ausente e auto_generate_missing=false.' });
      } else if (moduleRow.status !== 'success') {
        failures.push({ oracle_type: oracleType, error: moduleRow.error_message || 'Falha prévia no módulo.' });
      }

      modulesSnapshot[oracleType] = moduleRow;
    } catch (error) {
      failures.push({ oracle_type: oracleType, error: error.message });
      modulesSnapshot[oracleType] = null;
    }
  }

  const finalReading = await generateUnifiedReading({ userId, weekRef, modulesSnapshot });

  const payload = {
    user_id: userId,
    week_start: weekStart,
    week_ref: weekRef,
    inputs_snapshot: { week_start: weekStart, week_ref: weekRef, force_regenerate: forceRegenerate },
    modules_snapshot: modulesSnapshot,
    final_reading: finalReading,
    energy_score: finalReading.energy_score,
    tags: finalReading.tags,
  };

  const { data, error } = await supabase.from('unified_readings').insert(payload).select().single();
  if (error) throw error;

  return {
    unified: data,
    warnings: failures,
    partial_success: failures.length > 0,
  };
};

export const getMyUnifiedReadings = async (userId) => {
  const { data, error } = await supabase
    .from('unified_readings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getUnifiedById = async (userId, id) => {
  const { data, error } = await supabase
    .from('unified_readings')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
