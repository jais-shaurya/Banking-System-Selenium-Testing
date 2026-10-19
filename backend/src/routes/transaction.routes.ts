import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';

import {
    getTransactions,
    getTransactionsByAccountId,
    getTransactionById,
} from '../controllers/transaction.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getTransactions);
router.get('/account/:accountId', getTransactionsByAccountId);
router.get('/:transactionId', getTransactionById);

export default router;
