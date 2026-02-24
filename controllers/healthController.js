import { supabase } from '../integrations/supabaseClient.js';
import { sendSuccess } from '../shared/http/response.js';

export const health = (_req, res) => sendSuccess(res, { data: { status: 'ok' } });

export const ready = async (req, res, next) => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return sendSuccess(res, { data: { status: 'ready' }, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
};
