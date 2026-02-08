// routes/astrologyRoutes.js
import express from 'express';
import { getAstralChart } from '../controllers/astrologyController.js';

const router = express.Router();

router.post('/', getAstralChart);

export default router;
