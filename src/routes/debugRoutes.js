import { Router } from 'express';
import { authRequired } from '../middlewares/authRequired.js';
import { previewCentral, previewModules } from '../controllers/debugController.js';

const router = Router();
router.post('/debug/oracles/modules/preview', authRequired, previewModules);
router.post('/debug/oracles/central/preview', authRequired, previewCentral);
export default router;
