// tarot-backend/index.js

// 1. Importando os pacotes necessários
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 2. Configuração inicial do servidor
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// 3. Configuração de CORS (Cross-Origin Resource Sharing)
// Lista de endereços (origens) que têm permissão para acessar este backend
const allowedOrigins = [
  'http://localhost:5173', // Para desenvolvimento local do seu frontend
  'http://localhost:5174', // Outra porta comum do Vite
  'https://SEU-SITE-FRONTEND.vercel.app' // IMPORTANTE: Substitua pela URL do seu site na Vercel
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

// Middleware para aplicar as opções de CORS
app.use(cors(corsOptions));
// Habilita a resposta para a checagem "pre-flight" do navegador para todas as rotas
app.options('*', cors(corsOptions));

// Middleware para o servidor entender o formato JSON
app.use(express.json());

// 4. Configuração do Cliente Gemini
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("ERRO: A variável GOOGLE_API_KEY não foi encontrada no arquivo .env");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);


// ===================================================================
// ------------------------- NOSSAS ROTAS DE API ---------------------
// ===================================================================

// ROTA 1: Para gerar a leitura principal completa
app.post('/api/tarot', async (req, res) => {
  try {
    const { question, cards } = req.body;

    if (!question || !cards || !Array.isArray(cards) || cards.length !== 10) {
      return res.status(400).json({ error: 'Dados inválidos. Pergunta e 10 cartas são necessárias.' });
    }
    
    const prompt = `
      Aja como uma cartomante experiente. A pergunta é: "${question}".
      A tiragem da Cruz Celta foi: ${cards.map((card, i) => `${i+1}: ${card.nome} ${card.invertida ? '(Invertida)' : ''}`).join(', ')}.
      Sua tarefa é fornecer duas coisas, separadas por '----':
      1. UMA ANÁLISE GERAL E PROFUNDA da tiragem completa.
      2. DEPOIS de '----', UMA ANÁLISE CURTA (uma frase) para CADA UMA das 10 cartas, na ordem, separadas por ponto e vírgula ';'.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();

    const parts = rawText.split('----');
    const mainInterpretation = parts[0] ? parts[0].trim() : "Não foi possível gerar a interpretação principal.";
    const cardInterpretationsRaw = parts[1] ? parts[1].trim() : "";
    const cardInterpretations = cardInterpretationsRaw.split(';').map(text => text.trim());
    
    res.status(200).json({ mainInterpretation, cardInterpretations });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot:", error);
    res.status(500).json({ error: 'Falha ao processar a leitura do Tarot.' });
  }
});

// ROTA 2: Para o chat de diálogo sobre uma leitura
app.post('/api/tarot/chat', async (req, res) => {
  try {
    const { userMessage, chatContext } = req.body;

    if (!userMessage || !chatContext) {
      return res.status(400).json({ error: 'Mensagem e contexto do chat são necessários.' });
    }

    const prompt = `
      Você é uma cartomante sábia. O CONTEXTO DA LEITURA É: "${chatContext}".
      O consulente tem uma dúvida sobre a leitura. A pergunta dele é: "${userMessage}".
      Responda à pergunta de forma clara e empática, se baseando no contexto.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    res.status(200).json({ aiResponse });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot/chat:", error);
    res.status(500).json({ error: 'Falha ao processar a mensagem do chat.' });
  }
});

// ROTA 3: Para o significado didático de uma carta/posição
app.post('/api/tarot/card-meaning', async (req, res) => {
  try {
    const { cardName, cardOrientation, positionName } = req.body;

    if (!cardName || !cardOrientation || !positionName) {
      return res.status(400).json({ error: 'Dados da carta, orientação e posição são necessários.' });
    }

    const prompt = `
      Aja como um professor de Tarot. Explique de forma didática o que a carta "${cardName}" (${cardOrientation}) significa arquetipicamente na posição "${positionName}" de uma Cruz Celta.
      A resposta deve ser curta e geral, sem mencionar uma pergunta específica.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const didacticText = response.text();

    res.status(200).json({ didacticText });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot/card-meaning:", error);
    res.status(500).json({ error: 'Falha ao obter significado da carta.' });
  }
});


// 5. "Ligando" o servidor
app.listen(PORT, () => {
  console.log(`✨ Servidor do Oráculo de Tarot rodando em http://localhost:${PORT}`);
});
