// config/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config(); // Garante que as variáveis de ambiente sejam carregadas

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('ERRO: A variável GOOGLE_API_KEY não foi encontrada.');
  process.exit(1); // Interrompe a execução se a chave não estiver definida
}

export const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Mantém o fluxo simples de AI Studio (API key), sem provider/fallback de plataforma.
// Se não vier do .env, usa um modelo amplamente compatível em chave Studio.
export const geminiModelName =
  process.env.GEMINI_MODEL_PRIMARY ||
  process.env.GEMINI_MODEL ||
  'gemini-2.0-flash-001';
