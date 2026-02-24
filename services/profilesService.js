import { supabase } from '../integrations/supabaseClient.js';

export const upsertProfile = async (userId, payload) => {
  const record = { user_id: userId, ...payload, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('profiles').upsert(record, { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  return data;
};

export const getMyProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
};
