import dotenv from 'dotenv';

dotenv.config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  astrologyProvider: process.env.ASTROLOGY_PROVIDER || 'internal',
  astrologyApiKey: process.env.ASTROLOGY_API_KEY || '',
  astrologyApiUser: process.env.ASTROLOGY_API_USER || '',
  astrologyApiPass: process.env.ASTROLOGY_API_PASS || '',
  frontendUrl: process.env.FRONTEND_URL || '*',
};
