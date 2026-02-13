// config/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se a chave existe
if (!process.env.GOOGLE_API_KEY) {
  console.error('ERRO: A variável GOOGLE_API_KEY não foi encontrada.');
  process.exit(1);
}

// 1. Cria a conexão com o Google (APENAS UMA VEZ)
export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 2. Define o modelo
// Usamos o 'gemini-1.5-flash' porque ele é rápido e funciona em todas as regiões do Render.
export const geminiModelName = 'gemini-2.5-flash';
