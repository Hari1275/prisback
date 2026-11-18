import {
  ClassDecoratorFactory,
  Constructor,
  MetadataInspector,
} from '@prisback/context';
import {ControllerClass, ServiceOrProviderClass} from './application';
import {Component} from './component';

/**
 * Nest-style module metadata. Compiles down to a {@link Component}.
 */
export interface ModuleMetadata {
  /**
   * Other modules/components to import (mounted recursively).
   */
  imports?: Constructor<Component>[];

  /**
   * Controllers to register.
   */
  controllers?: ControllerClass[];

  /**
   * Providers / injectable services (bound via `app.service()`).
   */
  providers?: ServiceOrProviderClass[];
}

/**
 * Metadata key for `@Module()`.
 */
export const MODULE_KEY = 'prisback:module';

/**
 * Nest-style `@Module()` class decorator.
 *
 * Turns a class into a PrisBack {@link Component} so it can be mounted with
 * `app.component(UserModule)`.
 *
 * ```ts
 * @Module({
 *   imports: [PrismaModule],
 *   controllers: [UserController],
 *   providers: [UserRepository],
 * })
 * export class UserModule {}
 *
 * app.component(UserModule);
 * ```
 */
export function Module(metadata: ModuleMetadata = {}): ClassDecorator {
  const decorator = ClassDecoratorFactory.createDecorator<ModuleMetadata>(
    MODULE_KEY,
    metadata,
    {decoratorName: '@Module'},
  );

  return target => {
    decorator(target);

    const proto = target.prototype as Component;
    Object.defineProperty(proto, 'controllers', {
      value: metadata.controllers ?? [],
      writable: true,
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(proto, 'components', {
      value: metadata.imports ?? [],
      writable: true,
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(proto, 'services', {
      value: metadata.providers ?? [],
      writable: true,
      configurable: true,
      enumerable: true,
    });
  };
}

/**
 * Read `@Module()` metadata from a class.
 */
export function getModuleMetadata(
  target: Constructor<unknown>,
): ModuleMetadata | undefined {
  return MetadataInspector.getClassMetadata<ModuleMetadata>(MODULE_KEY, target);
}

/**
 * Convert `@Module()` metadata into a plain {@link Component} object.
 */
export function moduleToComponent(
  target: Constructor<unknown>,
): Component | undefined {
  const metadata = getModuleMetadata(target);
  if (!metadata) return undefined;
  return {
    controllers: metadata.controllers,
    components: metadata.imports,
    services: metadata.providers,
  };
}
