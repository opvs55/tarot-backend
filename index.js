import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importações
import { corsOptions } from './config/cors.js';
import tarotRoutes from './routes/tarotRoutes.js';
import numerologyRoutes from './routes/numerologyRoutes.js';
import v1Routes from './routes/v1/index.js';
import healthRoutes from './routes/healthRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// === 1. CORS DEVE VIR PRIMEIRO ===
app.use(cors(corsOptions));
// Garante que requisições OPTIONS (preflight) sejam respondidas
app.options('*', cors(corsOptions));

// === 2. DEPOIS O JSON ===
app.use(express.json());

// === 3. DEPOIS AS ROTAS ===
app.use('/api/tarot', tarotRoutes);
app.use('/api/numerology', numerologyRoutes);
app.use('/api/v1', v1Routes);
app.use('/health', healthRoutes);

// Rota Raiz
app.get('/', (req, res) => {
  res.send('Servidor Oráculo IA está Online!');
});

// Iniciar servidor ouvindo em 0.0.0.0 (Obrigatório para Render)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Servidor rodando na porta ${PORT}`);
});
