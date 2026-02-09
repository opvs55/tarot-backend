// routes/v1/oraclesRoutes.v1.js
import { Router } from 'express';
import { generateWeeklyOracleReading } from '../../controllers/oraclesController.js';

const router = Router();

router.post('/weekly-reading', generateWeeklyOracleReading);

export default router;
