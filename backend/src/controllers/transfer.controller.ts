import type { Request, Response } from 'express';
import type { Numeric } from '@prisma/orm-postgres/target/codec-types';
import { db } from '../prisma/db.js';
import { transferSchema } from '../validation/transfer.schema.js';

const toCents = (value: string): bigint => {
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'));
};

const toDecimal = (cents: bigint): string => `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;

export async function createTransfer(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const parsed = transferSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid transfer details' });
            return;
        }

        const { payerAccountId, payeeAccountNumber, amount: amountText } = parsed.data;

        const amountCents = toCents(amountText);
        if (amountCents <= 0n) {
            res.status(400).json({ error: 'Transfer amount must be greater than zero' });
            return;
        }

        const transaction = await db.transaction(async (tx) => {
            const payer = await tx.orm.public.Account.where({ id: payerAccountId }).first();
            if (!payer || payer.userId !== userId) {
                throw new Error('Payer account not found');
            }

            const payee = await tx.orm.public.Account
                .where({ accountNumber: payeeAccountNumber as Numeric<11> })
                .first();
            if (!payee) {
                throw new Error('Recipient account not found');
            }
            if (payer.id === payee.id) throw new Error('SELF_TRANSFER');

            const payerBalanceCents = toCents(String(payer.balance));
            if (payerBalanceCents < amountCents) throw new Error('INSUFFICIENT_FUNDS');
            const recipientBalanceCents = toCents(String(payee.balance));

            await tx.orm.public.Account.where({ id: payer.id }).update({
                balance: toDecimal(payerBalanceCents - amountCents) as typeof payer.balance,
            });
            await tx.orm.public.Account.where({ id: payee.id }).update({
                balance: toDecimal(recipientBalanceCents + amountCents) as typeof payee.balance,
            });
            return tx.orm.public.Transaction.create({
                payerAccountId: payer.id,
                payeeAccountId: payee.id,
                amount: toDecimal(amountCents) as typeof payer.balance,
                type: 'TRANSFER',
                status: 'completed',
            });
        });
        res.status(201).json({ message: 'Transfer completed successfully', transaction });
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message === 'Payer account not found' || message === 'Recipient account not found') {
            res.status(404).json({ error: message });
            return;
        }
        if (message === 'SELF_TRANSFER') {
            res.status(400).json({ error: 'Cannot transfer to the same account' });
            return;
        }
        if (message === 'INSUFFICIENT_FUNDS') {
            res.status(422).json({ error: 'Insufficient balance' });
            return;
        }
        console.error('Create transfer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
