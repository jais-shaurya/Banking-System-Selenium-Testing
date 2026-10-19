#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/06a2767aed128bef55c6af06e0a9b9e2018b003191d91b0ae54f18014f7b2844/contract';
import endContract from '../../snapshots/06a2767aed128bef55c6af06e0a9b9e2018b003191d91b0ae54f18014f7b2844/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a21f7129f78fee81b70edec7dbf3ae62144441271eaf899a5b79b98f8df77e09/contract';
import startContract from '../../snapshots/a21f7129f78fee81b70edec7dbf3ae62144441271eaf899a5b79b98f8df77e09/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Transaction',
        constraint: 'transaction_distinct_accounts_a66c6cce',
      }),
      this.dropNotNull({ schema: 'public', table: 'Transaction', column: 'payee_account_id' }),
      this.dropNotNull({ schema: 'public', table: 'Transaction', column: 'payer_account_id' }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Transaction',
        column: 'type',
        type: 'text',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Transaction',
        constraint: 'Transaction_type_check_37ebe6f2',
        expression: sql`"type" IN ('TRANSFER', 'DEPOSIT', 'WITHDRAWAL')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Transaction',
        constraint: 'transaction_accounts_by_type_1d513548',
        expression: sql`
        (
              ("type" = 'TRANSFER' AND payer_account_id IS NOT NULL AND payee_account_id IS NOT NULL)
              OR
              ("type" = 'DEPOSIT' AND payer_account_id IS NULL AND payee_account_id IS NOT NULL)
              OR
              ("type" = 'WITHDRAWAL' AND payer_account_id IS NOT NULL AND payee_account_id IS NULL)
            )
      `,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Transaction',
        constraint: 'transaction_distinct_accounts_a51c4e16',
        expression: sql`type <> 'TRANSFER' OR payer_account_id <> payee_account_id`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
