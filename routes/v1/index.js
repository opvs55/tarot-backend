import { Router } from 'express';
import { health, ready } from '../../controllers/healthController.js';
import { getProfileMe, upsertMyProfile } from '../../controllers/profileController.js';
import { getNatalChartMe, upsertMyNatalChart } from '../../controllers/natalChartController.js';
import {
  generateCentralWeeklyController,
  generateNatalSnapshotWeeklyController,
  generateNumerologyBaseController,
  generateNumerologyWeeklyController,
  generateTarotWeeklyController,
  previewCentralController,
  previewModulesController,
} from '../../controllers/oraclesControllerV2.js';
import { getUnifiedReadingByIdController, getUnifiedReadingsMeController } from '../../controllers/unifiedReadingsController.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/health', health);
router.get('/ready', ready);

router.post('/profiles/upsert', authMiddleware, upsertMyProfile);
router.get('/profiles/me', authMiddleware, getProfileMe);

router.post('/natal-chart/upsert', authMiddleware, upsertMyNatalChart);
router.get('/natal-chart/me', authMiddleware, getNatalChartMe);

router.post('/oracles/tarot/weekly/generate', authMiddleware, generateTarotWeeklyController);
router.post('/oracles/numerology/base/generate', authMiddleware, generateNumerologyBaseController);
router.post('/oracles/numerology/weekly/generate', authMiddleware, generateNumerologyWeeklyController);
router.post('/oracles/natal/snapshot-weekly', authMiddleware, generateNatalSnapshotWeeklyController);
router.post('/oracles/central/weekly/generate', authMiddleware, generateCentralWeeklyController);

router.get('/unified-readings/me', authMiddleware, getUnifiedReadingsMeController);
router.get('/unified-readings/:id', authMiddleware, getUnifiedReadingByIdController);

router.post('/debug/oracles/modules/preview', authMiddleware, previewModulesController);
router.post('/debug/oracles/central/preview', authMiddleware, previewCentralController);

export default router;
