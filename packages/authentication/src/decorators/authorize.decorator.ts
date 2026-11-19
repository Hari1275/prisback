import {
  Constructor,
  MetadataInspector,
  MethodDecoratorFactory,
} from '@prisback/core';
import {AuthorizationMetadata} from '../types';

export const AUTHORIZATION_METADATA_KEY = 'prisback:authorization:roles';

/**
 * Require one of the given roles on the current JWT user profile.
 *
 * ```ts
 * @authenticate('jwt')
 * @authorize('admin')
 * @get('/admin')
 * adminOnly() { ... }
 * ```
 */
export function authorize(...roles: string[]) {
  return MethodDecoratorFactory.createDecorator<AuthorizationMetadata>(
    AUTHORIZATION_METADATA_KEY,
    {roles},
    {decoratorName: '@authorize'},
  );
}

export function getAuthorizeMetadata(
  controllerCtor: Constructor<unknown>,
  methodName: string,
): AuthorizationMetadata | undefined {
  return MetadataInspector.getMethodMetadata<AuthorizationMetadata>(
    AUTHORIZATION_METADATA_KEY,
    controllerCtor.prototype,
    methodName,
  );
}
