#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1d34a8a0c624a91f30904df38dc135ed681c3b2cee6fc21686532ebb00f387ed/contract';
import endContract from '../../snapshots/1d34a8a0c624a91f30904df38dc135ed681c3b2cee6fc21686532ebb00f387ed/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Account',
        columns: [
          col('account_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('balance', 'numeric(19,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 19, scale: 2 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('user_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('account_balance_nonnegative_f70191a8', sql`balance >= 0`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Transaction',
        columns: [
          col('amount', 'numeric(19,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 19, scale: 2 } },
          }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('payee_account_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('payer_account_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Transaction_status_check_c4922048',
            sql`"status" IN ('pending', 'completed', 'failed')`,
          ),
          checkExpression('transaction_amount_positive_2612d8b9', sql`amount > 0`),
          checkExpression(
            'transaction_distinct_accounts_a66c6cce',
            sql`payer_account_id <> payee_account_id`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ph_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('user_phone_number_format_4db20a6c', sql`ph_number ~ '^[0-9]{10}$'`),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Account',
        constraint: 'Account_account_number_key',
        columns: ['account_number'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_ph_number_key',
        columns: ['ph_number'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Account',
        index: 'Account_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Transaction',
        index: 'Transaction_payee_account_id_created_at_idx_72ddd8a4',
        columns: ['payee_account_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Transaction',
        index: 'Transaction_payee_account_id_idx_25427ffe',
        columns: ['payee_account_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Transaction',
        index: 'Transaction_payer_account_id_created_at_idx_bf9d1d44',
        columns: ['payer_account_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Transaction',
        index: 'Transaction_payer_account_id_idx_34f40a2f',
        columns: ['payer_account_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Account',
        foreignKey: {
          name: 'Account_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Transaction',
        foreignKey: {
          name: 'Transaction_payee_account_id_fkey',
          columns: ['payee_account_id'],
          references: { schema: 'public', table: 'Account', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Transaction',
        foreignKey: {
          name: 'Transaction_payer_account_id_fkey',
          columns: ['payer_account_id'],
          references: { schema: 'public', table: 'Account', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
