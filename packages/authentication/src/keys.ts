import {BindingKey} from '@prisback/core';
import {
  PasswordHasher,
  TokenService,
  TokenServiceOptions,
  UserProfile,
} from './types';

/**
 * Metadata key for `@authenticate()` method decorator.
 */
export const AUTHENTICATION_METADATA_KEY =
  'prisback:authentication:operationsMetadata';

export namespace AuthenticationBindings {
  export const STRATEGY = 'jwt';

  export const CURRENT_USER = BindingKey.create<UserProfile | undefined>(
    'prisback.authentication.currentUser',
  );
}

export namespace TokenServiceBindings {
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'prisback.authentication.tokenService',
  );

  export const TOKEN_OPTIONS = BindingKey.create<TokenServiceOptions>(
    'prisback.authentication.tokenOptions',
  );
}

export namespace PasswordHasherBindings {
  export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>(
    'prisback.authentication.passwordHasher',
  );
}
