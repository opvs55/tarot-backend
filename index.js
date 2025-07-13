// tarot-backend/index.js

import express from 'express';
import cors from 'cors'; // A biblioteca que vamos configurar
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// ===================================================================
// ----------------- CONFIGURAÇÃO DE CORS (A CORREÇÃO) ---------------
// ===================================================================

// 1. Crie uma "lista de convidados" (whitelist) com os endereços que podem acessar seu backend.
const allowedOrigins = [
  'http://localhost:5173', // Seu frontend rodando localmente
  'http://localhost:5174', // Outra porta comum do Vite
  'https://SEU-SITE-FRONTEND.vercel.app' // IMPORTANTE: Coloque a URL do seu site na Vercel aqui quando fizer o deploy
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (como apps mobile ou Postman/curl) ou se a origem está na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'], // Permite os métodos que usamos
  allowedHeaders: ['Content-Type'], // Permite os cabeçalhos que usamos
};

// 2. Aplique as opções de CORS e habilite a resposta para o "preflight request"
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Responde OK para as checagens prévias do navegador

// ===================================================================

app.use(express.json());

// ... O restante do seu código (configuração do Gemini e as rotas) continua exatamente o mesmo ...

// Rota principal da nossa API de Tarot
app.post('/api/tarot', async (req, res) => {
  // ... seu código da rota ...
});

// Rota para o chat do Tarot
app.post('/api/tarot/chat', async (req, res) => {
  // ... seu código da rota ...
});

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`✨ Servidor do Oráculo de Tarot rodando em http://localhost:${PORT}`);
});
