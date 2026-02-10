// index.js (ou server.js) - Ponto de Entrada Refatorado
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar configurações e rotas dos módulos
import { corsOptions } from './config/cors.js'; // Importa a configuração do CORS
import tarotRoutes from './routes/tarotRoutes.js'; // Importa o router do Tarot
import numerologyRoutes from './routes/numerologyRoutes.js'; // Importa o router da Numerologia
import oraclesRoutes from './routes/oraclesRoutes.js'; // Importa o router do Oráculos
import astrologyRoutes from './routes/astrologyRoutes.js'; // Importa o router do Astrologia

import { generateWeeklyAstrologyTheme } from './controllers/astrologyController.js';

import v1Routes from './routes/v1/index.js';
import healthRoutes from './routes/healthRoutes.js';

import { requestId } from './shared/http/requestId.js';
import { errorHandler } from './shared/http/errorHandler.js';



// Nota: A configuração do Gemini (`config/gemini.js`) é usada dentro dos controllers, não diretamente aqui.
// Nota: O cliente Supabase (`config/supabaseClient.js`) é usado dentro dos controllers, não diretamente aqui.

// Carrega variáveis de ambiente do ficheiro .env
dotenv.config();

// Cria a aplicação Express
const app = express();
// Define a porta, usando a variável de ambiente ou 3001 como padrão
const PORT = process.env.PORT || 3001;

// === Middlewares Essenciais ===

// Habilita o CORS com as opções configuradas
app.use(cors(corsOptions));
// Habilita o pré-processamento de requisições OPTIONS pelo CORS (necessário para alguns browsers/métodos)
app.options('*', cors(corsOptions)); 
// Habilita o parseamento de corpos de requisição JSON
app.use(express.json()); 
app.use(requestId);

// === Montagem das Rotas ===

// Monta o router de Tarot no caminho base /api/tarot
// Todas as rotas definidas em tarotRoutes.js (/, /chat, /card-meaning)
// serão acessíveis a partir de /api/tarot/...
app.use('/api/tarot', tarotRoutes);           

// Monta o router de Numerologia no caminho base /api/numerology
// Todas as rotas definidas em numerologyRoutes.js (/ e /reset)
// serão acessíveis a partir de /api/numerology/...
app.use('/api/numerology', numerologyRoutes); 

// Monta o router de Oráculos no caminho base /api/oracles
// Todas as rotas definidas em oraclesRoutes.js (/weekly)
// serão acessíveis a partir de /api/oracles/...
app.use('/api/oracles', oraclesRoutes);

// Monta o router de Astrologia no caminho base /api/astrology
// Todas as rotas definidas em astrologyRoutes.js (/)
// serão acessíveis a partir de /api/astrology/...
app.use('/api/astrology', astrologyRoutes);


// Alias para compatibilidade com clientes antigos
app.post('/api/astral-chart', generateWeeklyAstrologyTheme);

app.use('/api/v1', v1Routes);
app.use('/health', healthRoutes);


app.use(errorHandler);



// === Rota Raiz (Opcional) ===

// Uma rota simples para verificar se o servidor está no ar
app.get('/', (req, res) => {
  // Envia uma resposta simples para requisições GET na raiz
  res.send('Servidor Oráculo IA (Refatorado) está online!'); 
});

// Rota simples de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// === Iniciar o Servidor ===

// Faz a aplicação Express "ouvir" na porta definida
app.listen(PORT, () => {
  // Exibe uma mensagem no console quando o servidor inicia com sucesso
  console.log(`✨ Servidor Oráculo IA (Refatorado) rodando em http://localhost:${PORT}`); 
});
