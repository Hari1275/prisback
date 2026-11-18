/**
 * Minimal Prisma Client contract used by PrisBack.
 * Compatible with generated `@prisma/client` PrismaClient.
 */
export interface PrismaClientLike {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}

/**
 * Options for {@link PrismaService}.
 */
export interface PrismaServiceOptions {
  /**
   * Optional pre-built Prisma client. Prefer binding
   * {@link PrismaBindings.CLIENT} instead.
   */
  client?: PrismaClientLike;
}
