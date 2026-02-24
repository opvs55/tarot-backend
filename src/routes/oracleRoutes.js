import { Router } from 'express';
import { authRequired } from '../middlewares/authRequired.js';
import {
  generateCentralWeekly,
  generateNatalSnapshotWeekly,
  generateNumerologyBase,
  generateNumerologyWeekly,
  generateTarotWeekly,
} from '../controllers/oracleController.js';

const router = Router();
router.post('/oracles/tarot/weekly/generate', authRequired, generateTarotWeekly);
router.post('/oracles/numerology/base/generate', authRequired, generateNumerologyBase);
router.post('/oracles/numerology/weekly/generate', authRequired, generateNumerologyWeekly);
router.post('/oracles/natal/snapshot-weekly', authRequired, generateNatalSnapshotWeekly);
router.post('/oracles/central/weekly/generate', authRequired, generateCentralWeekly);
export default router;
