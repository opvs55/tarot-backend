// routes/numerologyRoutes.js
import express from 'express';
import { calculateNumerology } from '../controllers/numerologyController.js';

const router = express.Router();

router.post('/', calculateNumerology); // Rota POST para /api/numerology

export default router;