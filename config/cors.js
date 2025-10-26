// config/cors.js (CORRIGIDO)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://oraculo-front-2-0.vercel.app'
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Acesso negado pela política de CORS'));
    }
  },
  // Adicione 'DELETE' à lista de métodos permitidos
  methods: ['GET', 'POST', 'DELETE'], // <<< CORREÇÃO AQUI
  // Adicione 'Authorization' se usar tokens (recomendado para DELETE)
  allowedHeaders: ['Content-Type', 'Authorization'], // <<< ADICIONE 'Authorization' SE NECESSÁRIO
};
