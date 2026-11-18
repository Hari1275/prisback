import {
  asLifeCycleObserver,
  Binding,
  BindingScope,
  Component,
  createBindingFromClass,
} from '@prisback/core';
import {PrismaBindings} from './keys';
import {PrismaService} from './prisma.service';

/**
 * Registers {@link PrismaService} as a singleton life-cycle observer.
 *
 * ```ts
 * app.bind(PrismaBindings.CLIENT).to(new PrismaClient());
 * app.component(PrismaComponent);
 * ```
 */
export class PrismaComponent implements Component {
  bindings: Binding[] = [
    createBindingFromClass(PrismaService, {
      key: PrismaBindings.PRISMA_SERVICE.key,
      defaultScope: BindingScope.SINGLETON,
    }).apply(asLifeCycleObserver),
  ];
}
