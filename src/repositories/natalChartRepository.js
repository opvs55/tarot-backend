import { supabase } from '../integrations/supabaseClient.js';

export const natalChartRepository = {
  async upsertByUserId(userId, payload) {
    const { data, error } = await supabase.from('natal_charts').upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    return data;
  },
  async findByUserId(userId) {
    const { data, error } = await supabase.from('natal_charts').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
};
