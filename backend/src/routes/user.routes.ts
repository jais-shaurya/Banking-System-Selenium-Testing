import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';

import {
    getProfile,
    updateProfile,
} from '../controllers/user.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/me', getProfile);
router.patch('/me', updateProfile);

export default router;
