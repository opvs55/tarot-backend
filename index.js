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
Aja como uma taróloga experiente com uma profunda abordagem psicológica e terapêutica. Sua voz é clara, didática e empática, mas também carrega um toque de sabedoria mística. Você usa as cartas como um mapa da psique do consulente, uma ferramenta para o autoconhecimento, e não como um oráculo de previsões definitivas.

O consulente, buscando orientação, fez a seguinte pergunta: "${question}".

A tiragem da Cruz Celta revelou as seguintes cartas em suas respectivas posições:
${cards.map((card, i) => `- Posição ${i + 1}: ${card.nome} ${card.invertida ? '(Invertida)' : ''}`).join('\n')}

Sua tarefa é criar uma interpretação única, fluida e coesa. Analise a jornada que as cartas apresentam, conectando o significado de cada posição da Cruz Celta com a carta que nela se encontra e, mais importante, com a pergunta original do consulente.

Foque nos aspectos psicológicos, nos padrões de comportamento, nos desafios internos e nos potenciais de crescimento que a tiragem sugere. Use uma linguagem acessível e popular, mas que inspire reflexão. Seja breve nos pontos claros e mais detalhada onde as energias são mais complexas.

Crie uma conexão com o consulente, tratando a leitura como um diálogo introspectivo, sem ser excessivamente familiar. Entregue a resposta como um texto único e corrido, sem divisões.
`;


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
