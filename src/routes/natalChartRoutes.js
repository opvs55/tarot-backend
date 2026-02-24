import { Router } from 'express';
import { authRequired } from '../middlewares/authRequired.js';
import { getMyNatalChart, previewNatalChart, renderNatalSvg, upsertNatalChart } from '../controllers/natalChartController.js';

const router = Router();
router.post('/natal-chart/upsert', authRequired, upsertNatalChart);
router.get('/natal-chart/me', authRequired, getMyNatalChart);
router.post('/natal-chart/preview', authRequired, previewNatalChart);
router.get('/natal-chart/render.svg', authRequired, renderNatalSvg);
export default router;
