import { supabase } from '../integrations/supabaseClient.js';

export const weeklyCardRepository = {
  async upsertByUserWeek(userId, weekStart, weekRef, cardsPayload) {
    const { data, error } = await supabase.from('weekly_cards').insert({ user_id: userId, week_start: weekStart, week_ref: weekRef, cards_payload: cardsPayload }).select().single();
    if (error) throw error;
    return data;
  },
};
