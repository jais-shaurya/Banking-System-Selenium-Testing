import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import {
    depositSchema,
    withdrawSchema,
} from '../validation/account-money.schema.js';

const toCents = (value: string): bigint => {
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'));
};

const toDecimal = (cents: bigint): string =>
    `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;

export async function deposit(req: Request, res: Response): Promise<void> {
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

        const parsed = depositSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid deposit details' });
            return;
        }

        const amountCents = toCents(parsed.data.amount);

        if (amountCents <= 0n) {
            res.status(400).json({
                error: 'Deposit amount must be greater than zero',
            });
            return;
        }

        const result = await db.transaction(async (tx) => {
            const account = await tx.orm.public.Account
                .where({ id: accountId, userId, deleted: false })
                .forUpdate()
                .first();

            if (!account) {
                throw new Error('ACCOUNT_NOT_FOUND');
            }

            const balanceCents = toCents(String(account.balance));
            const newBalance = toDecimal(
                balanceCents + amountCents,
            ) as typeof account.balance;

            await tx.orm.public.Account
                .where({ id: accountId, userId, deleted: false })
                .update({ balance: newBalance });

            const transaction = await tx.orm.public.Transaction.create({
                payerAccountId: null,
                payeeAccountId: account.id,
                amount: toDecimal(amountCents) as typeof account.balance,
                type: 'DEPOSIT',
                status: 'completed',
            });

            return {
                amount: toDecimal(amountCents),
                balance: newBalance,
                transactionId: transaction.id,
            };
        });

        res.status(200).json({
            message: 'Deposit completed successfully',
            accountId,
            amount: result.amount,
            balance: result.balance,
            transactionId: result.transactionId,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'ACCOUNT_NOT_FOUND'
        ) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        console.error('Deposit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function withdraw(req: Request, res: Response): Promise<void> {
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

        const parsed = withdrawSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid withdrawal details' });
            return;
        }

        const amountCents = toCents(parsed.data.amount);

        if (amountCents <= 0n) {
            res.status(400).json({
                error: 'Withdrawal amount must be greater than zero',
            });
            return;
        }

        const user = await db.orm.public.User
            .where({ id: userId })
            .select('password')
            .first();

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (!(await bcrypt.compare(parsed.data.password, user.password))) {
            res.status(401).json({ error: 'Invalid password' });
            return;
        }

        const result = await db.transaction(async (tx) => {
            const account = await tx.orm.public.Account
                .where({ id: accountId, userId, deleted: false })
                .forUpdate()
                .first();

            if (!account) {
                throw new Error('ACCOUNT_NOT_FOUND');
            }

            const balanceCents = toCents(String(account.balance));

            if (amountCents > balanceCents) {
                throw new Error('INSUFFICIENT_FUNDS');
            }

            const newBalance = toDecimal(
                balanceCents - amountCents,
            ) as typeof account.balance;

            await tx.orm.public.Account
                .where({ id: accountId, userId, deleted: false })
                .update({ balance: newBalance });

            const transaction = await tx.orm.public.Transaction.create({
                payerAccountId: account.id,
                payeeAccountId: null,
                amount: toDecimal(amountCents) as typeof account.balance,
                type: 'WITHDRAWAL',
                status: 'completed',
            });

            return {
                amount: toDecimal(amountCents),
                balance: newBalance,
                transactionId: transaction.id,
            };
        });

        res.status(200).json({
            message: 'Withdrawal completed successfully',
            accountId,
            amount: result.amount,
            balance: result.balance,
            transactionId: result.transactionId,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'ACCOUNT_NOT_FOUND'
        ) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        if (
            error instanceof Error &&
            error.message === 'INSUFFICIENT_FUNDS'
        ) {
            res.status(422).json({ error: 'Insufficient balance' });
            return;
        }

        console.error('Withdrawal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
