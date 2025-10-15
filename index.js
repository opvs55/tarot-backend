// Arquivo do seu backend (index.js ou server.js) - VERSÃO FINAL COM EXTRATOR DE JSON

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuração inicial (sem alterações)
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://oraculo-front-2-0.vercel.app'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Acesso negado pela política de CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Configuração do Cliente Gemini (sem alterações)
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("ERRO: A variável GOOGLE_API_KEY não foi encontrada no arquivo .env");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);
const geminiModel = "gemini-pro";


// ===================================================================
// ------------------------- NOSSAS ROTAS DE API ---------------------
// ===================================================================

app.post('/api/tarot', async (req, res) => {
  try {
    const { question, cards, spreadType } = req.body;

    if (!question || !cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos. Pergunta e cartas são necessárias.' });
    }
    
    let prompt;
    if (spreadType === 'threeCards') {
      prompt = `
      Você é uma taróloga sábia e intuitiva... (PROMPT COMPLETO PARA 3 CARTAS AQUI)
      ...retorne sua resposta EXCLUSIVAMENTE em formato JSON, sem nenhum texto ou formatação extra...
      `;
    } else { 
      prompt = `
      Aja como uma taróloga experiente... (PROMPT COMPLETO DA CRUZ CELTA AQUI)
      `;
    }

    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    if (spreadType === 'threeCards') {
      try {
        // AQUI ESTÁ A NOVA LÓGICA ROBUSTA
        const startIndex = rawText.indexOf('{');
        const endIndex = rawText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
          throw new Error("Objeto JSON não encontrado na resposta da IA.");
        }
        
        const jsonString = rawText.substring(startIndex, endIndex + 1);
        const jsonData = JSON.parse(jsonString);
        
        res.status(200).json({ interpretationType: 'structured', data: jsonData });

      } catch (e) {
        console.error("LOG: Falha ao extrair ou fazer parse do JSON.", { error: e.message, rawText });
        res.status(200).json({ interpretationType: 'simple', data: { mainInterpretation: "Ocorreu um erro ao formatar a resposta da IA. O texto original é: " + rawText, cardInterpretations: [] } });
      }
    } else {
      const parts = rawText.split('----');
      const mainInterpretation = parts[0] ? parts[0].trim() : rawText;
      const cardInterpretationsRaw = parts[1] ? parts[1].trim() : "";
      const cardInterpretations = cardInterpretationsRaw.split(';').map(text => text.trim());
      res.status(200).json({ interpretationType: 'simple', data: { mainInterpretation, cardInterpretations } });
    }

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot:", error);
    res.status(500).json({ error: 'Falha ao processar a leitura do Tarot.' });
  }
});


// ... RESTANTE DO SEU CÓDIGO (ROTAS /chat, /card-meaning e app.listen) ...
