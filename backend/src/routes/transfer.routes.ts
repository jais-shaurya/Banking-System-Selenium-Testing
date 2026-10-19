import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';

import {
    createTransfer,
} from '../controllers/transfer.controller.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createTransfer);

export default router;
