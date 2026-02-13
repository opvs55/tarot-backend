import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GOOGLE_API_KEY) {
  console.error('ERRO CRÍTICO: GOOGLE_API_KEY não encontrada no .env');
  process.exit(1);
}

// Inicializa a conexão (APENAS UMA VEZ)
export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Você pediu o modelo mais novo. O 2.0 Flash é o sucessor rápido.
export const geminiModelName = 'gemini-2.5-flash';
