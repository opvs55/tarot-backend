import { supabase } from '../integrations/supabaseClient.js';

export const oracleWeeklyModuleRepository = {
  async findByUserWeekAndType(userId, weekRef, oracleType) {
    const { data, error } = await supabase.from('oracle_weekly_modules').select('*').eq('user_id', userId).eq('week_ref', weekRef).eq('oracle_type', oracleType).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
  async upsertModule(userId, weekStart, weekRef, oracleType, payload) {
    const { data, error } = await supabase.from('oracle_weekly_modules').insert({ user_id: userId, week_start: weekStart, week_ref: weekRef, oracle_type: oracleType, ...payload }).select().single();
    if (error) throw error;
    return data;
  },
};
