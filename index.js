// Arquivo do seu backend (index.js ou server.js) - VERSÃO 100% COMPLETA

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuração inicial
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

// Configuração do Cliente Gemini
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("ERRO: A variável GOOGLE_API_KEY não foi encontrada no arquivo .env");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);
const geminiModel = "gemini-2.5-flash";


// ===================================================================
// ------------------------- ROTA PRINCIPAL DO TAROT ---------------------
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
      Você é uma taróloga sábia e intuitiva. Sua tarefa é analisar uma pergunta e escolher o melhor método de leitura de 3 cartas para respondê-la, e depois realizar a interpretação.

      1.  **ANÁLISE DA PERGUNTA:**
          A pergunta do consulente é: "${question}"

      2.  **ESCOLHA DO MÉTODO:**
          Baseado na pergunta, escolha UM dos seguintes contextos para a leitura de 3 cartas:
          - ["Passado", "Presente", "Futuro"]: Para questões sobre desenvolvimento temporal, causas e consequências.
          - ["Situação", "Obstáculo", "Conselho"]: Para problemas atuais e busca por orientação prática.
          - ["Mente", "Corpo", "Espírito"]: Para questões de autoconhecimento e equilíbrio interno.
          - ["Você", "A outra pessoa", "A Relação"]: Para questões sobre relacionamentos.

      3.  **CARTAS SORTEADAS:**
          As 3 cartas sorteadas foram:
          - Carta 1: ${cards[0].nome} ${cards[0].invertida ? '(Invertida)' : ''}
          - Carta 2: ${cards[1].nome} ${cards[1].invertida ? '(Invertida)' : ''}
          - Carta 3: ${cards[2].nome} ${cards[2].invertida ? '(Invertida)' : ''}

      4.  **TAREFA FINAL:**
          Agora, retorne sua resposta EXCLUSIVAMENTE em formato JSON, sem nenhum texto ou formatação extra (como \`\`\`json), seguindo esta estrutura:
          {
            "contexto_escolhido": {
              "titulo": "O nome do método que você escolheu (ex: Situação, Obstáculo, Conselho)",
              "posicoes": ["Nome da Posição 1", "Nome da Posição 2", "Nome da Posição 3"]
            },
            "interpretacao": {
              "titulo_leitura": "Crie um título poético e impactante para esta leitura específica.",
              "resumo": "Escreva um parágrafo curto e direto que resuma a mensagem central das cartas.",
              "analise_cartas": [
                {
                  "posicao": "Nome da Posição 1",
                  "texto": "Analise a primeira carta dentro do significado desta posição, conectando com a pergunta do consulente."
                },
                {
                  "posicao": "Nome da Posição 2",
                  "texto": "Analise a segunda carta dentro do significado desta posição, conectando com a pergunta do consulente."
                },
                {
                  "posicao": "Nome da Posição 3",
                  "texto": "Analise a terceira carta dentro do significado desta posição, conectando com a pergunta do consulente."
                }
              ],
              "conselho_final": "Conclua com um parágrafo de conselho prático e inspirador para o consulente."
            }
          }
      `;
    } else { 
      prompt = `
Aja como uma taróloga experiente com uma profunda abordagem psicológica e terapêutica.

O consulente, buscando orientação, fez a seguinte pergunta: "${question}". A tiragem da Cruz Celta revelou as seguintes cartas em suas respectivas posições:
${cards.map((card, i) => `- Posição ${i + 1}: ${card.nome} ${card.invertida ? '(Invertida)' : ''}`).join('\n')}
Sua tarefa é criar uma interpretação muito breve, fluida e coesa. Analise a jornada que as cartas apresentam, conectando o significado de cada posição da Cruz Celta com a carta que nela se encontra e, mais importante, com a pergunta original do consulente. Foque nos aspectos psicológicos, nos padrões de comportamento, nos desafios internos e nos potenciais de crescimento que a tiragem sugere. Use uma linguagem acessível e popular, mas que inspire reflexão. Crie uma conexão com o consulente, tratando a leitura como um diálogo introspectivo, sem ser excessivamente familiar. Entregue a resposta como um texto único e corrido, sem divisões.
`;
    }

    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    if (spreadType === 'threeCards') {
      try {
        const startIndex = rawText.indexOf('{');
        const endIndex = rawText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
          throw new Error("Objeto JSON válido não foi encontrado na resposta da IA.");
        }
        
        const jsonString = rawText.substring(startIndex, endIndex + 1);
        const jsonData = JSON.parse(jsonString);
        
        return res.status(200).json({ interpretationType: 'structured', data: jsonData });

      } catch (e) {
        console.error("LOG: Falha ao extrair ou fazer parse do JSON.", { error: e.message, rawText });
        return res.status(200).json({ interpretationType: 'simple', data: { mainInterpretation: "Ocorreu um erro ao formatar a resposta da IA. O texto original é: " + rawText, cardInterpretations: [] } });
      }
    } else {
      const parts = rawText.split('----');
      const mainInterpretation = parts[0] ? parts[0].trim() : rawText;
      const cardInterpretationsRaw = parts[1] ? parts[1].trim() : "";
      const cardInterpretations = cardInterpretationsRaw.split(';').map(text => text.trim());
      return res.status(200).json({ interpretationType: 'simple', data: { mainInterpretation, cardInterpretations } });
    }

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot:", error);
    return res.status(500).json({ error: 'Falha ao processar a leitura do Tarot.' });
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
