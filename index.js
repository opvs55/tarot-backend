// index.js (ou server.js) - Novo Ponto de Entrada
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar configurações e rotas
import { corsOptions } from './config/cors.js';
import tarotRoutes from './routes/tarotRoutes.js';
import numerologyRoutes from './routes/numerologyRoutes.js';

// Configuração inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares essenciais
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pré-verificação CORS
app.use(express.json()); // Para parsear JSON no corpo das requisições

// Montar as rotas
app.use('/api/tarot', tarotRoutes);           // Todas as rotas de tarot começarão com /api/tarot
app.use('/api/numerology', numerologyRoutes); // Todas as rotas de numerologia começarão com /api/numerology

// Rota "raiz" opcional para verificar se o servidor está online
app.get('/', (req, res) => {
  res.send('Servidor Oráculo IA está online!');
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`✨ Servidor Oráculo IA rodando em http://localhost:${PORT}`);
});