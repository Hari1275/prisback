import {inject} from '@prisback/core';
import {PrismaBindings} from './keys';

/**
 * Inject the singleton {@link PrismaService}.
 *
 * ```ts
 * class UserRepository {
 *   constructor(@injectPrisma() private prisma: PrismaService) {}
 * }
 * ```
 */
export function injectPrisma() {
  return inject(PrismaBindings.PRISMA_SERVICE);
}

/**
 * Alias of {@link injectPrisma} for repository-style naming.
 */
export function repository() {
  return injectPrisma();
}
