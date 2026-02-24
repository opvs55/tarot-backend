import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

export const supabaseHealthCheck = async () => {
  const { error } = await supabase.from('profiles').select('id').limit(1);
  if (error) throw error;
  return { ok: true };
};
