import { supabase } from '../integrations/supabaseClient.js';

export const profileRepository = {
  async upsertByUserId(userId, data) {
    const { data: row, error } = await supabase.from('profiles').upsert({ user_id: userId, ...data }, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    return row;
  },
  async findByUserId(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
};
