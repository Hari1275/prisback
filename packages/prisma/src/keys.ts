import {BindingKey} from '@prisback/core';
import {PrismaClientLike, PrismaServiceOptions} from './types';

/**
 * Binding keys for `@prisback/prisma`.
 */
export namespace PrismaBindings {
  /**
   * Underlying Prisma client instance (usually `new PrismaClient()`).
   */
  export const CLIENT = BindingKey.create<PrismaClientLike>(
    'prisback.prisma.client',
  );

  /**
   * Singleton PrismaService key.
   * Typed loosely here to avoid circular imports; cast at use site.
   */
  export const PRISMA_SERVICE = BindingKey.create<
    import('./prisma.service').PrismaService
  >('prisback.prisma.service');

  /**
   * Optional config for PrismaService.
   */
  export const PRISMA_SERVICE_OPTIONS =
    BindingKey.create<PrismaServiceOptions>(
      'prisback.prisma.service.options',
    );
}
