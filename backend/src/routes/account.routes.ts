import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { deposit, withdraw } from '../controllers/account-money.controller.js';

import {createAccount, deleteAccount, getAccounts, getAccountById} from '../controllers/account.controller.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createAccount);
router.post('/:accountId/deposit', deposit);
router.post('/:accountId/withdraw', withdraw);
router.get('/', getAccounts);
router.get('/:accountId', getAccountById);
router.delete('/:accountId', deleteAccount);

export default router;
