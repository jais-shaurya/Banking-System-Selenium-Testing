#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1d34a8a0c624a91f30904df38dc135ed681c3b2cee6fc21686532ebb00f387ed/contract';
import startContract from '../../snapshots/1d34a8a0c624a91f30904df38dc135ed681c3b2cee6fc21686532ebb00f387ed/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/5ba7258bb6272176fbeabb26481a1646e26c9901afe7afbd330f124670d0825e/contract';
import endContract from '../../snapshots/5ba7258bb6272176fbeabb26481a1646e26c9901afe7afbd330f124670d0825e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.alterColumnType({
        schema: 'public',
        table: 'Account',
        column: 'account_number',
        type: 'numeric(11)',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
