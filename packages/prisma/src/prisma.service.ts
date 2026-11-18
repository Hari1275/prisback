import {
  BindingScope,
  config,
  inject,
  lifeCycleObserver,
  LifeCycleObserver,
} from '@prisback/core';
import {PrismaBindings} from './keys';
import {PrismaClientLike, PrismaServiceOptions} from './types';

/**
 * Try to construct the generated PrismaClient when no client is bound.
 * Safe no-op fallback is used in unit tests without `@prisma/client`.
 */
function createDefaultClient(): PrismaClientLike {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@prisma/client') as {
      PrismaClient?: new () => PrismaClientLike;
    };
    if (mod.PrismaClient) {
      return new mod.PrismaClient();
    }
  } catch {
    // peer dependency may be absent during package unit tests
  }
  return {
    async $connect() {
      /* no-op default */
    },
    async $disconnect() {
      /* no-op default */
    },
  };
}

/**
 * Prisma integration service.
 *
 * Wraps a Prisma Client, registers as a life-cycle observer, and exposes
 * the client for repositories/controllers via {@link PrismaService.client}.
 *
 * Apps typically bind a generated client:
 * ```ts
 * app.bind(PrismaBindings.CLIENT).to(new PrismaClient());
 * app.component(PrismaComponent);
 * ```
 */
@lifeCycleObserver('datasource', {scope: BindingScope.SINGLETON})
export class PrismaService implements LifeCycleObserver {
  readonly client: PrismaClientLike;

  constructor(
    @inject(PrismaBindings.CLIENT, {optional: true})
    client?: PrismaClientLike,
    @config({fromBinding: PrismaBindings.PRISMA_SERVICE, optional: true})
    options: PrismaServiceOptions = {},
  ) {
    this.client = client ?? options.client ?? createDefaultClient();
  }

  /**
   * Called during application `init` — opens the DB connection.
   */
  async init(): Promise<void> {
    await this.client.$connect();
  }

  /**
   * Called during application `stop` — closes the DB connection.
   */
  async stop(): Promise<void> {
    await this.client.$disconnect();
  }

  /** Alias for {@link PrismaService.init}. */
  async $connect(): Promise<void> {
    return this.init();
  }

  /** Alias for {@link PrismaService.stop}. */
  async $disconnect(): Promise<void> {
    return this.stop();
  }
}
