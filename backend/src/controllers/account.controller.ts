import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import type { Numeric } from '@prisma/orm-postgres/target/codec-types';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { db } from '../prisma/db.js';

const deleteAccountBodySchema = z.object({
    password: z.string().min(1).max(72),
}).strict();

export async function createAccount(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!(await db.orm.public.User.where({ id: userId }).first())) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        const accountNumber = String(randomInt(10_000_000_000, 99_999_999_999)) as Numeric<11>;

        if (!accountNumber) {
            res.status(500).json({ error: 'Unable to create account' });
            return;
        }
        const account = await db.orm.public.Account.create({ userId, accountNumber });
        res.status(201).json({
            message: 'Account created successfully',
            account: { id: account.id, accountNumber: account.accountNumber, balance: account.balance },
        });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAccounts(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const accounts = await db.orm.public.Account
            .where({ userId, deleted: false })
            .select('id', 'accountNumber', 'balance')
            .all();
        res.status(200).json({ message: 'Accounts fetched successfully', accounts });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAccountById(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        const accountId = Number(req.params.accountId);
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!Number.isSafeInteger(accountId) || accountId < 1) {
            res.status(400).json({ error: 'Invalid account ID' });
            return;
        }
        const account = await db.orm.public.Account
            .where({ id: accountId, userId, deleted: false })
            .select('id', 'accountNumber', 'balance')
            .first();
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        res.status(200).json({ message: 'Account fetched successfully', account });
    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        const accountId = Number(req.params.accountId);
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!Number.isSafeInteger(accountId) || accountId < 1) {
            res.status(400).json({ error: 'Invalid account ID' });
            return;
        }

        const parsed = deleteAccountBodySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid request data', details: parsed.error.issues });
            return;
        }

        const user = await db.orm.public.User.where({ id: userId }).first();
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (!(await bcrypt.compare(parsed.data.password, user.password))) {
            res.status(401).json({ error: 'Invalid password' });
            return;
        }

        const account = await db.orm.public.Account
            .where({ id: accountId, userId, deleted: false })
            .first();
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        if (Number(account.balance) !== 0) {
            res.status(409).json({ error: 'Account balance must be zero before deletion' });
            return;
        }

        await db.orm.public.Account
            .where({ id: accountId, userId, deleted: false })
            .update({ deleted: true });
        res.status(200).json({ message: 'Account deleted successfully', accountId });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
