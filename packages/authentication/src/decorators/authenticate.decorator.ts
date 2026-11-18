import {
  Constructor,
  MetadataInspector,
  MethodDecoratorFactory,
} from '@prisback/core';
import {AUTHENTICATION_METADATA_KEY, AuthenticationBindings} from '../keys';
import {AuthenticationMetadata} from '../types';

/**
 * Mark a controller method as requiring JWT authentication.
 *
 * ```ts
 * @authenticate('jwt')
 * @get('/profile')
 * me() {}
 * ```
 */
export function authenticate(
  ...strategies: (string | AuthenticationMetadata)[]
): MethodDecorator {
  const specs: AuthenticationMetadata[] = strategies.map(s =>
    typeof s === 'string' ? {strategy: s} : s,
  );
  if (!specs.length) {
    specs.push({strategy: AuthenticationBindings.STRATEGY});
  }

  return MethodDecoratorFactory.createDecorator<AuthenticationMetadata[]>(
    AUTHENTICATION_METADATA_KEY,
    specs,
    {decoratorName: '@authenticate'},
  );
}

export function getAuthenticateMetadata(
  controllerClass: Constructor<unknown>,
  methodName: string,
): AuthenticationMetadata[] | undefined {
  return MetadataInspector.getMethodMetadata<AuthenticationMetadata[]>(
    AUTHENTICATION_METADATA_KEY,
    controllerClass.prototype,
    methodName,
  );
}
