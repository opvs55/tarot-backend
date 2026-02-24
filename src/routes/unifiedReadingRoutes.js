import { Router } from 'express';
import { authRequired } from '../middlewares/authRequired.js';
import { getMyUnifiedReadings, getUnifiedReadingById } from '../controllers/unifiedReadingController.js';

const router = Router();
router.get('/unified-readings/me', authRequired, getMyUnifiedReadings);
router.get('/unified-readings/:id', authRequired, getUnifiedReadingById);
export default router;
