import { supabase } from '../integrations/supabaseClient.js';

export const upsertNatalChart = async (userId, payload) => {
  const record = { user_id: userId, ...payload, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('natal_charts').upsert(record, { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  return data;
};

export const getMyNatalChart = async (userId) => {
  const { data, error } = await supabase.from('natal_charts').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
};

export const generateNatalSnapshot = async ({ userId, weekStart, weekRef }) => ({
  summary: `Snapshot astral da semana ${weekRef}.`,
  highlights: ['foco emocional', 'clareza mental'],
  week_start: weekStart,
  week_ref: weekRef,
  // TODO: substituir por cálculos astrais reais com efemérides e casas.
  source: 'natal_stub',
  user_id: userId,
});
