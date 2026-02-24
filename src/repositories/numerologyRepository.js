import { supabase } from '../integrations/supabaseClient.js';

export const numerologyRepository = {
  async upsertBaseReading(userId, data) {
    const { data: row, error } = await supabase.from('numerology_readings').upsert({ user_id: userId, ...data }, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    return row;
  },
  async upsertWeeklyReading(userId, weekStart, weekRef, readingPayload) {
    const { data, error } = await supabase.from('numerology_weekly_readings').insert({ user_id: userId, week_start: weekStart, week_ref: weekRef, reading_payload: readingPayload }).select().single();
    if (error) throw error;
    return data;
  },
};
