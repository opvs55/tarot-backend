// tarot-backend/index.js

// 1. Importando os pacotes necessários
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 2. Configuração inicial do servidor
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001; // Usaremos a porta 3001 por padrão

// 3. Middlewares
app.use(cors()); // Permite que qualquer frontend acesse nosso backend
app.use(express.json()); // Permite que o servidor entenda o formato JSON

// 4. Configuração do Cliente Gemini
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("ERRO: A variável GOOGLE_API_KEY não foi encontrada no arquivo .env");
  process.exit(1); // Encerra a aplicação se a chave não for encontrada
}
const genAI = new GoogleGenerativeAI(API_KEY);

// 5. Rota principal da nossa API de Tarot
app.post('/api/tarot', async (req, res) => {
  try {
    console.log("LOG: Requisição recebida em /api/tarot com o corpo:", req.body);
    const { question, cards } = req.body;

    if (!question || !cards || !Array.isArray(cards) || cards.length !== 10) {
      return res.status(400).json({ error: 'Dados inválidos. Pergunta e 10 cartas são necessárias.' });
    }

    // PROMPT ATUALIZADO: Pedimos a análise geral E as análises individuais
    const prompt = `
      Aja como uma cartomante experiente e sábia. A pergunta do consulente é: "${question}".
      A tiragem da Cruz Celta resultou nas seguintes cartas:
      ${cards.map((card, index) => `- Posição ${index + 1}: ${card.nome} ${card.invertida ? '(Invertida)' : ''}`).join('\n')}

      Sua tarefa é fornecer duas coisas em sua resposta, separadas por '----':
      1.  PRIMEIRO, escreva uma análise geral, coesa e profunda, conectando as cartas com a pergunta.
      2.  DEPOIS, escreva a linha '----'.
      3.  APÓS a linha, forneça uma análise curta e direta (uma ou duas frases) para CADA UMA das 10 cartas, na ordem em que apareceram. Separe a análise de cada carta com um ponto e vírgula ';'. Não inclua o nome da carta, apenas a análise.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    // Processando a resposta para separar a análise geral das individuais
    const parts = rawText.split('----');
    const mainInterpretation = parts[0] ? parts[0].trim() : "Não foi possível gerar a interpretação principal.";
    const cardInterpretationsRaw = parts[1] ? parts[1].trim() : "";
    const cardInterpretations = cardInterpretationsRaw.split(';').map(text => text.trim());

    // Enviamos um objeto JSON mais rico para o frontend
    res.status(200).json({ mainInterpretation, cardInterpretations });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot:", error);
    res.status(500).json({ error: 'Falha ao processar a leitura do Tarot.' });
  }
});

app.post('/api/tarot/chat', async (req, res) => {
  try {
    console.log("LOG: Requisição recebida em /api/tarot/chat:", req.body);
    const { userMessage, chatContext } = req.body;

    if (!userMessage || !chatContext) {
      return res.status(400).json({ error: 'Mensagem e contexto do chat são necessários.' });
    }

    const prompt = `
      Você é uma cartomante sábia que acabou de realizar uma leitura de Tarot para um consulente.
      O CONTEXTO DA LEITURA É: "${chatContext}".

      O consulente agora tem uma dúvida sobre a leitura. A pergunta dele é: "${userMessage}".

      Responda à pergunta do consulente de forma clara, empática e concisa, mantendo seu papel de cartomante e se baseando estritamente no contexto fornecido. Não invente novas informações.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    res.status(200).json({ aiResponse });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot/chat:", error);
    res.status(500).json({ error: 'Falha ao processar a mensagem do chat.' });
  }
});


app.post('/api/tarot/card-meaning', async (req, res) => {
  try {
    console.log("LOG: Requisição recebida em /api/tarot/card-meaning:", req.body);
    const { cardName, cardOrientation, positionName } = req.body;

    if (!cardName || !cardOrientation || !positionName) {
      return res.status(400).json({ error: 'Dados da carta, orientação e posição são necessários.' });
    }

    const prompt = `
      Aja como um professor de Tarot experiente.
      Explique de forma didática, clara e concisa o que a carta "${cardName}" (${cardOrientation}) significa arquetipicamente quando aparece na posição "${positionName}" de uma tiragem de Cruz Celta.
      Foque apenas no significado geral da combinação carta/posição. Não mencione nenhuma pergunta específica do consulente.
      Sua resposta deve ter no máximo 2 ou 3 frases.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const didacticText = response.text();

    res.status(200).json({ didacticText });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot/card-meaning:", error);
    res.status(500).json({ error: 'Falha ao obter significado da carta.' });
  }
});
// 6. Iniciando o servidor
app.listen(PORT, () => {
  console.log(`✨ Servidor do Oráculo de Tarot rodando em http://localhost:${PORT}`);
});
