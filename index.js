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

    if (!question || !cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Dados inválidos. É necessário enviar "question" e "cards".' });
    }

    const prompt = `
      Aja como uma cartomante experiente e sábia. A pergunta do consulente é: "${question}".
      A tiragem da Cruz Celta resultou nas seguintes cartas:
      ${cards.map((card, index) => `- Posição ${index + 1}: ${card.nome} ${card.invertida ? '(Invertida)' : ''}`).join('\n')}
      Forneça uma análise coesa e profunda, conectando as cartas com a pergunta. Ofereça conselhos e reflexões.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const interpretation = response.text();

    res.status(200).json({ interpretation });

  } catch (error) {
    console.error("LOG: Erro no endpoint /api/tarot:", error);
    res.status(500).json({ error: 'Falha ao processar a leitura do Tarot.' });
  }
});

// 6. Iniciando o servidor
app.listen(PORT, () => {
  console.log(`✨ Servidor do Oráculo de Tarot rodando em http://localhost:${PORT}`);
});