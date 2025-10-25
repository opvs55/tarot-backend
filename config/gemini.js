// config/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config(); // Garante que as variáveis de ambiente sejam carregadas

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("ERRO: A variável GOOGLE_API_KEY não foi encontrada.");
  process.exit(1); // Interrompe a execução se a chave não estiver definida
}

export const genAI = new GoogleGenerativeAI(API_KEY);
export const geminiModelName = "gemini-2.5-flash"; // Nome do modelo centralizado aqui