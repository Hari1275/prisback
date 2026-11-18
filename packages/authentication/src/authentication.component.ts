import {
  Binding,
  BindingScope,
  Component,
  createBindingFromClass,
} from '@prisback/core';
import {PasswordHasherBindings, TokenServiceBindings} from './keys';
import {AuthenticationInterceptorProvider} from './providers/authentication.interceptor';
import {BcryptHasher} from './services/bcrypt.hasher';
import {JWTService} from './services/jwt.service';

/**
 * Registers JWT token service, password hasher, and auth interceptor.
 */
export class AuthenticationComponent implements Component {
  bindings: Binding[] = [
    createBindingFromClass(JWTService, {
      key: TokenServiceBindings.TOKEN_SERVICE.key,
      defaultScope: BindingScope.SINGLETON,
    }),
    createBindingFromClass(BcryptHasher, {
      key: PasswordHasherBindings.PASSWORD_HASHER.key,
      defaultScope: BindingScope.SINGLETON,
    }),
    createBindingFromClass(AuthenticationInterceptorProvider),
  ];
}
