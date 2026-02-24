import { Router } from 'express';
import { getMyProfile, upsertProfile } from '../controllers/profileController.js';
import { authRequired } from '../middlewares/authRequired.js';

const router = Router();
router.post('/profiles/upsert', authRequired, upsertProfile);
router.get('/profiles/me', authRequired, getMyProfile);
export default router;
