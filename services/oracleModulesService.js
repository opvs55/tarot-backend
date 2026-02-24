import { supabase } from '../integrations/supabaseClient.js';
import { getIsoWeekInfo } from './weekService.js';
import { generateNatalSnapshot } from './natalChartService.js';

const MODULE_STATUS = {
  success: 'success',
  failed: 'failed',
};

const tarotWeeklyGenerator = ({ weekRef }) => ({
  theme: `Tarot semanal ${weekRef}`,
  cards: ['The Sun', 'Strength', 'The Star'],
  guidance: 'Confie no processo e mantenha constância.',
});

const numerologyBaseGenerator = ({ userId }) => ({
  user_id: userId,
  life_path: 7,
  expression: 3,
  // TODO: aplicar cálculo numerológico real a partir de nome completo e data de nascimento.
  source: 'numerology_stub',
});

const numerologyWeeklyGenerator = ({ weekRef }) => ({
  week_ref: weekRef,
  personal_week_number: 4,
  recommendation: 'Organize prioridades e conclua pendências.',
});

export const getExistingModule = async ({ userId, oracleType, weekRef }) => {
  const { data, error } = await supabase
    .from('oracle_weekly_modules')
    .select('*')
    .eq('user_id', userId)
    .eq('oracle_type', oracleType)
    .eq('week_ref', weekRef)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const saveModuleSnapshot = async ({ userId, weekStart, weekRef, oracleType, inputPayload, outputPayload, status, errorMessage, modelMeta }) => {
  const { data, error } = await supabase.from('oracle_weekly_modules').insert({
    user_id: userId,
    week_start: weekStart,
    week_ref: weekRef,
    oracle_type: oracleType,
    input_payload: inputPayload,
    output_payload: outputPayload,
    status,
    error_message: errorMessage,
    model_meta: modelMeta,
  }).select().single();

  if (error) throw error;
  return data;
};

export const runWeeklyModule = async ({ userId, weekStart: inputWeekStart, forceRegenerate = false, oracleType }) => {
  const { weekStart, weekRef } = getIsoWeekInfo(inputWeekStart);

  if (!forceRegenerate) {
    const existing = await getExistingModule({ userId, oracleType, weekRef });
    if (existing?.status === MODULE_STATUS.success) {
      return { module: existing, reused: true, weekStart, weekRef };
    }
  }

  const inputPayload = { week_start: weekStart, week_ref: weekRef };
  let outputPayload = null;
  let status = MODULE_STATUS.success;
  let errorMessage = null;

  try {
    if (oracleType === 'tarot_weekly') outputPayload = tarotWeeklyGenerator({ weekRef });
    else if (oracleType === 'numerology_weekly') outputPayload = numerologyWeeklyGenerator({ weekRef });
    else if (oracleType === 'natal_snapshot') outputPayload = await generateNatalSnapshot({ userId, weekStart, weekRef });
    else throw new Error(`Módulo ${oracleType} não suportado.`);
  } catch (error) {
    status = MODULE_STATUS.failed;
    errorMessage = error.message;
  }

  const module = await saveModuleSnapshot({
    userId,
    weekStart,
    weekRef,
    oracleType,
    inputPayload,
    outputPayload,
    status,
    errorMessage,
    modelMeta: { provider: 'stub', version: '1.0.0' },
  });

  return { module, reused: false, weekStart, weekRef };
};

export const generateNumerologyBase = async ({ userId, payload }) => {
  const reading = numerologyBaseGenerator({ userId, ...payload });
  const { data, error } = await supabase
    .from('numerology_readings')
    .insert({ user_id: userId, reading_payload: reading, input_payload: payload })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const generateNumerologyWeekly = async ({ userId, weekStart, forceRegenerate }) => {
  const result = await runWeeklyModule({ userId, weekStart, forceRegenerate, oracleType: 'numerology_weekly' });
  const { data, error } = await supabase
    .from('numerology_weekly_readings')
    .insert({ user_id: userId, week_start: result.weekStart, week_ref: result.weekRef, reading_payload: result.module.output_payload })
    .select()
    .single();
  if (error) throw error;
  return { ...result, numerology_weekly_row: data };
};

export const generateTarotWeekly = async ({ userId, weekStart, forceRegenerate }) => {
  const result = await runWeeklyModule({ userId, weekStart, forceRegenerate, oracleType: 'tarot_weekly' });
  const { data, error } = await supabase
    .from('weekly_cards')
    .insert({ user_id: userId, week_start: result.weekStart, week_ref: result.weekRef, cards_payload: result.module.output_payload })
    .select()
    .single();
  if (error) throw error;
  return { ...result, weekly_cards_row: data };
};
