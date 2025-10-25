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
// ----------------- ROTA PRINCIPAL DO TAROT (CORRIGIDA) -----------------
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
      A pergunta do consulente é: "${question}"
      As 3 cartas sorteadas foram:
      - Carta 1: ${cards[0].nome} ${cards[0].invertida ? '(Invertida)' : ''}
      - Carta 2: ${cards[1].nome} ${cards[1].invertida ? '(Invertida)' : ''}
      - Carta 3: ${cards[2].nome} ${cards[2].invertida ? '(Invertida)' : ''}
      TAREFA FINAL: Retorne sua resposta EXCLUSIVAMENTE em formato JSON, sem nenhum texto extra, seguindo esta estrutura:
      {
        "contexto_escolhido": {
          "titulo": "O nome do método que você escolheu (ex: Situação, Obstáculo, Conselho)",
          "posicoes": ["Nome da Posição 1", "Nome da Posição 2", "Nome da Posição 3"]
        },
        "interpretacao": {
          "titulo_leitura": "Crie um título poético e impactante.",
          "resumo": "Escreva um parágrafo curto resumindo a mensagem central.",
          "analise_cartas": [
            { "posicao": "Nome da Posição 1", "texto": "Analise a primeira carta nesta posição." },
            { "posicao": "Nome da Posição 2", "texto": "Analise a segunda carta nesta posição." },
            { "posicao": "Nome da Posição 3", "texto": "Analise a terceira carta nesta posição." }
          ],
          "conselho_final": "Conclua com um parágrafo de conselho prático."
        }
      }`;
    } else if (spreadType === 'templeOfAphrodite') {
      // Este já está atualizado para 'name1' e 'name2'
      prompt = `
      Aja como uma taróloga especialista em relacionamentos. A análise é entre "${question.name1}" e "${question.name2}".
      AS CARTAS SÃO:
      - Posição 1 (Pensamentos de ${question.name1}): ${cards[0].nome} ${cards[0].invertida ? '(Invertida)' : ''}
      - Posição 2 (Sentimentos de ${question.name1}): ${cards[1].nome} ${cards[1].invertida ? '(Invertida)' : ''}
      - Posição 3 (Atração de ${question.name1}): ${cards[2].nome} ${cards[2].invertida ? '(Invertida)' : ''}
      - Posição 4 (Pensamentos de ${question.name2}): ${cards[3].nome} ${cards[3].invertida ? '(Invertida)' : ''}
      - Posição 5 (Sentimentos de ${question.name2}): ${cards[4].nome} ${cards[4].invertida ? '(Invertida)' : ''}
      - Posição 6 (Atração de ${question.name2}): ${cards[5].nome} ${cards[5].invertida ? '(Invertida)' : ''}
      - Posição 7 (Futuro do Casal): ${cards[6].nome} ${cards[6].invertida ? '(Invertida)' : ''}
      TAREFA FINAL: Retorne sua resposta EXCLUSIVAMENTE em formato JSON, sem nenhum texto extra, seguindo esta estrutura:
      {
        "titulo_leitura": "Crie um título poético.",
        "resumo_geral": "Escreva um parágrafo curto resumindo a dinâmica.",
        "analise_pessoa1": {
          "titulo": "Análise de ${question.name1}",
          "pensamentos": "Analise a carta 1.",
          "sentimentos": "Analise a carta 2.",
          "atracao": "Analise a carta 3."
        },
        "analise_pessoa2": {
          "titulo": "Análise de ${question.name2}",
          "pensamentos": "Analise a carta 4.",
          "sentimentos": "Analise a carta 5.",
          "atracao": "Analise a carta 6."
        },
        "futuro_casal": {
          "titulo": "O Futuro do Casal",
          "texto": "Analise a carta 7 como a síntese."
        }
      }`;
    } else if (spreadType === 'pathChoice') {
      prompt = `
      Aja como uma conselheira sábia. A dúvida é: Caminho 1: "${question.path1}" vs Caminho 2: "${question.path2}".
      CARTAS CAMINHO 1:
      - Posição 1 (Favorece): ${cards[0].nome} ${cards[0].invertida ? '(Invertida)' : ''}
      - Posição 2 (Trabalhar): ${cards[1].nome} ${cards[1].invertida ? '(Invertida)' : ''}
      - Posição 3 (Perspectiva): ${cards[2].nome} ${cards[2].invertida ? '(Invertida)' : ''}
      - Posição 4 (Conselho): ${cards[3].nome} ${cards[3].invertida ? '(Invertida)' : ''}
      CARTAS CAMINHO 2:
      - Posição 1 (Favorece): ${cards[4].nome} ${cards[4].invertida ? '(Invertida)' : ''}
      - Posição 2 (Trabalhar): ${cards[5].nome} ${cards[5].invertida ? '(Invertida)' : ''}
      - Posição 3 (Perspectiva): ${cards[6].nome} ${cards[6].invertida ? '(Invertida)' : ''}
      - Posição 4 (Conselho): ${cards[7].nome} ${cards[7].invertida ? '(Invertida)' : ''}
      TAREFA FINAL: Retorne sua resposta EXCLUSIVAMENTE em formato JSON, sem nenhum texto extra, seguindo esta estrutura:
      {
        "titulo_leitura": "Crie um título poético.",
        "caminho1": {
          "titulo": "${question.path1}",
          "analises": [
            { "posicao": "O que favorece", "texto": "Analise a carta 1." },
            { "posicao": "O que precisa ser trabalhado", "texto": "Analise a carta 2." },
            { "posicao": "Perspectiva", "texto": "Analise a carta 3." },
            { "posicao": "Conselho", "texto": "Analise a carta 4." }
          ]
        },
        "caminho2": {
          "titulo": "${question.path2}",
          "analises": [
            { "posicao": "O que favorece", "texto": "Analise a carta 5." },
            { "posicao": "O que precisa ser trabalhado", "texto": "Analise a carta 6." },
            { "posicao": "Perspectiva", "texto": "Analise a carta 7." },
            { "posicao": "Conselho", "texto": "Analise a carta 8." }
          ]
        },
        "comparativo_final": "Escreva um parágrafo de conclusão comparando os caminhos."
      }`;
    
    // <<< ESTE É O NOVO PROMPT "BONITO" PARA A CRUZ CELTA >>>
    } else if (spreadType === 'celticCross') {
      prompt = `
      Aja como uma taróloga experiente. A pergunta é: "${question}".
      AS CARTAS SÃO:
      - Posição 1 (O Coração da Matéria): ${cards[0].nome} ${cards[0].invertida ? '(Invertida)' : ''}
      - Posição 2 (O Desafio): ${cards[1].nome} ${cards[1].invertida ? '(Invertida)' : ''}
      - Posição 3 (A Base): ${cards[2].nome} ${cards[2].invertida ? '(Invertida)' : ''}
      - Posição 4 (O Passado): ${cards[3].nome} ${cards[3].invertida ? '(Invertida)' : ''}
      - Posição 5 (O Objetivo): ${cards[4].nome} ${cards[4].invertida ? '(Invertida)' : ''}
      - Posição 6 (O Caminho): ${cards[5].nome} ${cards[5].invertida ? '(Invertida)' : ''}
      - Posição 7 (O Consulente): ${cards[6].nome} ${cards[6].invertida ? '(Invertida)' : ''}
      - Posição 8 (O Ambiente): ${cards[7].nome} ${cards[7].invertida ? '(Invertida)' : ''}
      - Posição 9 (Esperanças e Medos): ${cards[8].nome} ${cards[8].invertida ? '(Invertida)' : ''}
      - Posição 10 (O Resultado Final): ${cards[9].nome} ${cards[9].invertida ? '(Invertida)' : ''}

      TAREFA FINAL: Retorne sua resposta EXCLUSIVAMENTE em formato JSON, sem nenhum texto extra, seguindo esta estrutura:
      {
        "titulo_leitura": "Crie um título poético para esta leitura.",
        "resumo_geral": "Escreva um parágrafo curto que resuma a mensagem central da jornada.",
        "analise_cartas": [
          { "posicao": "Posição 1: O Coração da Matéria", "texto": "Analise a carta 1 (${cards[0].nome}) neste contexto." },
          { "posicao": "Posição 2: O Desafio", "texto": "Analise a carta 2 (${cards[1].nome}) neste contexto." },
          { "posicao": "Posição 3: A Base", "texto": "Analise a carta 3 (${cards[2].nome}) neste contexto." },
          { "posicao": "Posição 4: O Passado", "texto": "Analise a carta 4 (${cards[3].nome}) neste contexto." },
          { "posicao": "Posição 5: O Objetivo", "texto": "Analise a carta 5 (${cards[4].nome}) neste contexto." },
          { "posicao": "Posição 6: O Caminho", "texto": "Analise a carta 6 (${cards[5].nome}) neste contexto." },
          { "posicao": "Posição 7: O Consulente", "texto": "Analise a carta 7 (${cards[6].nome}) neste contexto." },
          { "posicao": "Posição 8: O Ambiente", "texto": "Analise a carta 8 (${cards[7].nome}) neste contexto." },
          { "posicao": "Posição 9: Esperanças e Medos", "texto": "Analise a carta 9 (${cards[8].nome}) neste contexto." }
        ],
        "conselho_final": "Analise a carta 10 (${cards[9].nome}) como a síntese e o conselho final."
      }`;
    } else { 
      console.error(`[Oraculo Backend] ERRO: spreadType '${spreadType}' não é reconhecido.`);
      return res.status(400).json({ error: `O tipo de tiragem '${spreadType}' não é reconhecido pelo servidor.` });
  }

    // --- GERAÇÃO E PROCESSAMENTO DA RESPOSTA ---

    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    // <<< ESTE 'IF' AGORA PROCESSA TODAS AS TIRAGENS COMO JSON >>>
    if (spreadType === 'threeCards' || spreadType === 'templeOfAphrodite' || spreadType === 'pathChoice' || spreadType === 'celticCross') {
      try {
        const startIndex = rawText.indexOf('{');
        const endIndex = rawText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
          throw new Error("Objeto JSON válido não foi encontrado na resposta da IA.");
        }
        
        const jsonString = rawText.substring(startIndex, endIndex + 1);
        const jsonData = JSON.parse(jsonString);
        
        // Envia o JSON estruturado padronizado
        return res.status(200).json({ interpretationType: 'structured', data: jsonData });

      } catch (e) {
        console.error("LOG: Falha ao extrair ou fazer parse do JSON.", { error: e.message, rawText });
        // Fallback de erro: retorna o texto bruto como 'simple' para depuração
        return res.status(200).json({ 
            interpretationType: 'simple', 
            data: { 
                mainInterpretation: "Ocorreu um erro ao formatar a resposta da IA. O texto original é: " + rawText, 
                cardInterpretations: [] 
            } 
        });
      }
    } else {
      // Este 'else' não deve ser atingido se todos os spreadTypes estiverem no 'if' acima
      console.warn(`[Oraculo Backend] WARN: A resposta para '${spreadType}' não foi processada como JSON.`);
      return res.status(200).json({ 
        interpretationType: 'simple', 
        data: { 
            mainInterpretation: rawText, 
            cardInterpretations: [] 
        } 
      });
    }

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot:", error);
    return res.status(500).json({ error: 'Falha ao processar a leitura do Tarot.' });
  }
});

// ===================================================================
// ------------------------- OUTRAS ROTAS (INTACTAS) -----------------
// ===================================================================

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
      Você é uma cartomante experiente. Explique de forma didática o que a carta "${cardName}" (${cardOrientation}) significa arquetipicamente na posição "${positionName}" de uma Cruz Celta.
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
