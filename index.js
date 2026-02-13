// index.js (Corrigido e Limpo)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// === Importações (Apenas uma vez cada!) ===
import { corsOptions } from './config/cors.js';
import tarotRoutes from './routes/tarotRoutes.js';
import numerologyRoutes from './routes/numerologyRoutes.js';
import v1Routes from './routes/v1/index.js';
import healthRoutes from './routes/healthRoutes.js';

// Carrega variáveis de ambiente
dotenv.config();

// Cria a aplicação Express
const app = express();

// Define a porta (Essencial para o Render)
const PORT = process.env.PORT || 3001;

// === Middlewares ===
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pré-flight
app.use(express.json());

// === Rotas ===
app.use('/api/tarot', tarotRoutes);
app.use('/api/numerology', numerologyRoutes);
app.use('/api/v1', v1Routes);
app.use('/health', healthRoutes);

// Rota Raiz
app.get('/', (req, res) => {
  res.send('Servidor Oráculo IA está Online!');
});

// === Iniciar o Servidor ===
// O '0.0.0.0' é OBRIGATÓRIO para o Render aceitar conexões externas
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Servidor rodando na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
