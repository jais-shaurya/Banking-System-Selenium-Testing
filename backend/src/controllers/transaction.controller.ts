import type { Request, Response } from 'express';
import { or } from '@prisma/orm-postgres/orm-client';
import { db } from '../prisma/db.js';

export async function getTransactions(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const accounts = await db.orm.public.Account
            .where({ userId, deleted: false })
            .select('id')
            .all();

        
        const accountIds = accounts.map((account) => account.id);
        if (accountIds.length === 0) {
            res.status(200).json({ message: 'Transactions fetched successfully', transactions: [] });
            return;
        }
        const ownedAccountIds = new Set(accountIds);
        

        const transactions = await db.orm.public.Transaction
            .where((transaction) => or(
                transaction.payerAccountId.in(accountIds),
                transaction.payeeAccountId.in(accountIds),
            ))
            .include('payerAccount', (account) => account.select('accountNumber'))
            .include('payeeAccount', (account) => account.select('accountNumber'))
            .all();

            
        transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
        const results = transactions.map((transaction) => {
            const isDebit = transaction.payerAccountId !== null && ownedAccountIds.has(transaction.payerAccountId);
            return {
                id: transaction.id,
                amount: transaction.amount,
                status: transaction.status,
                type: transaction.type,
                createdAt: transaction.createdAt,
                from: transaction.payerAccount?.accountNumber ?? null,
                to: transaction.payeeAccount?.accountNumber ?? null,
                direction: isDebit ? 'debit' : 'credit',
            };
        });
        res.status(200).json({
            message: 'Transactions fetched successfully',
            transactions: results,
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getTransactionsByAccountId(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        const accountId = Number(req.params?.accountId);
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
            .select('id')
            .first();
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        const transactions = await db.orm.public.Transaction
            .where((transaction) => or(
                transaction.payerAccountId.eq(accountId),
                transaction.payeeAccountId.eq(accountId),
            ))
            .include('payerAccount', (payer) => payer.select('accountNumber'))
            .include('payeeAccount', (payee) => payee.select('accountNumber'))
            .all();
        transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);

        const results = transactions.map((transaction) => {
            const isDebit = transaction.payerAccountId === accountId;
            return {
                id: transaction.id,
                amount: transaction.amount,
                status: transaction.status,
                type: transaction.type,
                createdAt: transaction.createdAt,
                from: transaction.payerAccount?.accountNumber ?? null,
                to: transaction.payeeAccount?.accountNumber ?? null,
                direction: isDebit ? 'debit' : 'credit',
            };
        });

        res.status(200).json({ message: 'Transactions fetched successfully', transactions: results });
    } catch (error) {
        console.error('Get account transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getTransactionById(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        const transactionId = Number(req.params?.transactionId);

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!Number.isSafeInteger(transactionId) || transactionId < 1) {
            res.status(400).json({ error: 'Invalid transaction ID' });
            return;
        }
        const transaction = await db.orm.public.Transaction
            .where({ id: transactionId })
            .include('payerAccount', (account) => account.select('id', 'userId', 'accountNumber', 'deleted'))
            .include('payeeAccount', (account) => account.select('id', 'userId', 'accountNumber', 'deleted'))
            .first();
        const ownsPayerAccount = transaction?.payerAccount?.userId === userId && !transaction.payerAccount.deleted;
        const ownsPayeeAccount = transaction?.payeeAccount?.userId === userId && !transaction.payeeAccount.deleted;
        if (!transaction || (!ownsPayerAccount && !ownsPayeeAccount)) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        const isDebit = ownsPayerAccount;
        const result = {
            id: transaction.id,
            amount: transaction.amount,
            status: transaction.status,
            type: transaction.type,
            createdAt: transaction.createdAt,
            from: transaction.payerAccount?.accountNumber ?? null,
            to: transaction.payeeAccount?.accountNumber ?? null,
            direction: isDebit ? 'debit' : 'credit',
        };
        res.status(200).json({ message: 'Transaction fetched successfully', transaction: result });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
