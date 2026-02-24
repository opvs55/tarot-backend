import { supabase } from '../integrations/supabaseClient.js';

export const unifiedReadingRepository = {
  async upsertUnifiedReading(payload) {
    const { data, error } = await supabase.from('unified_readings').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async listByUser(userId) {
    const { data, error } = await supabase.from('unified_readings').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async findByIdForUser(id, userId) {
    const { data, error } = await supabase.from('unified_readings').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
};
