/**
 * Minimal Prisma Client contract used by PrisBack.
 * Compatible with generated `@prisma/client` PrismaClient.
 */
export interface PrismaClientLike {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  /** Used by readiness probes when available. */
  $queryRaw?: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
  $runCommandRaw?: (command: object) => Promise<unknown>;
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
