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

// 4. Configuração do Cliente Gemini
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("ERRO: A variável GOOGLE_API_KEY não foi encontrada no arquivo .env");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);
const geminiModel = "gemini-2.5-flash"; // Modelo atualizado para o mais recente estável


// ===================================================================
// ------------------------- NOSSAS ROTAS DE API ---------------------
// ===================================================================

// ROTA 1: Para gerar a leitura principal completa (COM AS ALTERAÇÕES)
app.post('/api/tarot', async (req, res) => {
  try {
    // ALTERAÇÃO 1: Recebemos o 'spreadType' do frontend
    const { question, cards, spreadType } = req.body;

    // ALTERAÇÃO 2: A validação agora é mais flexível
    if (!question || !cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos. Pergunta e cartas são necessárias.' });
    }
    
    // ALTERAÇÃO 3: O prompt para a IA agora é gerado dinamicamente
    let prompt;
    switch (spreadType) {
      case 'threeCards':
        prompt = `
Aja como uma taróloga experiente com uma abordagem psicológica e terapêutica.
O consulente fez a seguinte pergunta: "${question}".
A tiragem de 3 cartas (Passado, Presente, Futuro) revelou:
- Passado: ${cards[0].nome} ${cards[0].invertida ? '(Invertida)' : ''}
- Presente: ${cards[1].nome} ${cards[1].invertida ? '(Invertida)' : ''}
- Futuro: ${cards[2].nome} ${cards[2].invertida ? '(Invertida)' : ''}
Crie uma interpretação fluida e coesa, conectando a energia de cada carta à sua posição no tempo e à pergunta original. Foque nos aspectos psicológicos e nos potenciais de crescimento. Use uma linguagem acessível e inspiradora. Entregue a resposta como um texto único e corrido.
`;
        break;

      case 'celticCross':
      default: // Se o spreadType não for reconhecido, assume a Cruz Celta
        prompt = `
Aja como uma taróloga experiente com uma profunda abordagem psicológica e terapêutica.
O consulente, buscando orientação, fez a seguinte pergunta: "${question}". A tiragem da Cruz Celta revelou as seguintes cartas em suas respectivas posições:
${cards.map((card, i) => `- Posição ${i + 1}: ${card.nome} ${card.invertida ? '(Invertida)' : ''}`).join('\n')}
Sua tarefa é criar uma interpretação muito breve, fluida e coesa. Analise a jornada que as cartas apresentam, conectando o significado de cada posição da Cruz Celta com a carta que nela se encontra e, mais importante, com a pergunta original do consulente. Foque nos aspectos psicológicos, nos padrões de comportamento, nos desafios internos e nos potenciais de crescimento que a tiragem sugere. Use uma linguagem acessível e popular, mas que inspire reflexão. Crie uma conexão com o consulente, tratando a leitura como um diálogo introspectivo, sem ser excessivamente familiar. Entregue a resposta como um texto único e corrido, sem divisões.
`;
        break;
    }

    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent(prompt);
    // Usamos um método mais seguro para extrair o texto, caso a resposta não venha como esperado
    const rawText = result.response.text ? result.response.text() : "A IA não forneceu uma resposta em texto.";

    // A lógica de separação da resposta pode ser simplificada, a IA pode retornar um JSON.
    // Por enquanto, mantemos a sua lógica original de split.
    const parts = rawText.split('----');
    const mainInterpretation = parts[0] ? parts[0].trim() : rawText; // Se não houver '----', usa o texto todo.
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

// ROTA 3: Para o significado didático de uma carta/posição
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
