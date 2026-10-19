import { Router } from 'express';

import {verifyJWT} from '../middleware/auth.js';

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import accountRoutes from './account.routes.js';
import transferRoutes from './transfer.routes.js';
import transactionRoutes from './transaction.routes.js';

const router = Router();

router.use('/auth', authRoutes);

router.use(verifyJWT); 
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transfers', transferRoutes);
router.use('/transactions', transactionRoutes);

export default router;