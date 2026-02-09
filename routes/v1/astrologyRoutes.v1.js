// routes/v1/astrologyRoutes.v1.js
import { Router } from 'express';
import { generateWeeklyAstrologyTheme } from '../../controllers/astrologyController.js';

const router = Router();

router.get('/weekly-theme', generateWeeklyAstrologyTheme);
router.post('/weekly-theme', generateWeeklyAstrologyTheme);

export default router;
