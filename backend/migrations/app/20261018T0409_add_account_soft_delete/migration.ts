#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/024cde3c7c0519df684efbd748f8db2a36399aba05eb9b4d5d497f2123d52bbf/contract';
import startContract from '../../snapshots/024cde3c7c0519df684efbd748f8db2a36399aba05eb9b4d5d497f2123d52bbf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a21f7129f78fee81b70edec7dbf3ae62144441271eaf899a5b79b98f8df77e09/contract';
import endContract from '../../snapshots/a21f7129f78fee81b70edec7dbf3ae62144441271eaf899a5b79b98f8df77e09/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Account',
        column: col('deleted', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
