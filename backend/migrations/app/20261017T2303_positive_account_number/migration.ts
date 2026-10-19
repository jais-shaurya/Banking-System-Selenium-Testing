#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/024cde3c7c0519df684efbd748f8db2a36399aba05eb9b4d5d497f2123d52bbf/contract';
import endContract from '../../snapshots/024cde3c7c0519df684efbd748f8db2a36399aba05eb9b4d5d497f2123d52bbf/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/5ba7258bb6272176fbeabb26481a1646e26c9901afe7afbd330f124670d0825e/contract';
import startContract from '../../snapshots/5ba7258bb6272176fbeabb26481a1646e26c9901afe7afbd330f124670d0825e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addCheckConstraint({
        schema: 'public',
        table: 'Account',
        constraint: 'positive_account_number_2d43456c',
        expression: sql`account_number > 0`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
