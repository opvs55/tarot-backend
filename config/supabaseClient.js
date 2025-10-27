// config/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis do .env

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Verifica se as variáveis foram carregadas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não definidas.");
  // Poderia lançar um erro ou sair, dependendo da sua preferência
  // process.exit(1); 
}

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);