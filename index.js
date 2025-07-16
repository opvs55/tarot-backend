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
// Usando a sua configuração que permite múltiplas origens
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://oraculo-front-2-0.vercel.app' // A sua URL de produção que você definiu
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

// Uma pequena melhoria: definimos o nome do modelo uma vez para usar em todas as rotas.
// Usei o nome oficial mais recente para garantir estabilidade.
const geminiModel = "gemini-2.5-flash-lite-preview-06-17";


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
  Incorpore a persona de uma cartomante sábia, que lê as cartas não como sentenças de um juiz, mas como os versos de um poema sobre a alma. Sua voz é calma, profunda e repleta de metáforas.
  A pergunta que ecoa no ar é: "${question}". As lâminas se abriram na antiga Cruz Celta, pintando a seguinte cena: ${cards.map((card, i) => `${i + 1}: ${card.nome} ${card.invertida ? ' (sussurrando invertida)' : ''}`).join(', ')}.
  Sua tarefa é tecer a interpretação em duas partes 1. A GRANDE TAPEÇARIA: Primeiro, revele a narrativa central que as cartas criam juntas. Não seja literal ou técnica. Pinte um quadro com palavras.
  Use imagens da natureza, dos sonhos e dos mitos para descrever as energias em jogo. Fale das sombras como se fossem vales e das esperanças como se fossem picos de montanhas. Crie uma história fluida e simbólica que conecte 
  o fluxo das dez cartas.
  2. OS FIOS INDIVIDUAIS:  ofereça uma única frase poética ou um dito enigmático para CADA UMA das 10 cartas, na ordem, que capture a essência de sua mensagem. Separe cada frase com um ponto e vírgula ';'.`;


    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

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

// ROTA 2: Para o chat de diálogo sobre uma leitura (RESTAURADA)
app.post('/api/tarot/chat', async (req, res) => {
  try {
    const { userMessage, chatContext } = req.body;
    if (!userMessage || !chatContext) {
      return res.status(400).json({ error: 'Mensagem e contexto do chat são necessários.' });
    }

    const prompt = `
      Você é uma cartomante sábia. O CONTEXTO DA LEITURA É: "${chatContext}".
      O consulente tem uma dúvida sobre a leitura. A pergunta dele é: "${userMessage}".
      Responda à pergunta de forma clara, curta, objetiva e empática, se baseando no contexto.
    `;

    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    res.status(200).json({ aiResponse });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot/chat:", error);
    res.status(500).json({ error: 'Falha ao processar a mensagem do chat.' });
  }
});

// ROTA 3: Para o significado didático de uma carta/posição (RESTAURADA)
app.post('/api/tarot/card-meaning', async (req, res) => {
  try {
    const { cardName, cardOrientation, positionName } = req.body;
    if (!cardName || !cardOrientation || !positionName) {
      return res.status(400).json({ error: 'Dados da carta, orientação e posição são necessários.' });
    }

    const prompt = `
      Aja como um professor de Tarot. Explique de forma didática o que a carta "${cardName}" (${cardOrientation}) significa arquetipicamente na posição "${positionName}" de uma Cruz Celta.
      A resposta deve ser curta e geral (2-3 frases), sem mencionar uma pergunta específica do consulente.
    `;

    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent(prompt);
    const didacticText = result.response.text();

    res.status(200).json({ didacticText });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot/card-meaning:", error);
    res.status(500).json({ error: 'Falha ao obter significado da carta.' });
  }
});


// 6. "Ligando" o servidor
app.listen(PORT, () => {
  console.log(`✨ Servidor do Oráculo de Tarot rodando em http://localhost:${PORT}`);
});
