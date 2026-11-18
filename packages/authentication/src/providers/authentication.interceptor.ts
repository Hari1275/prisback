import {
  asGlobalInterceptor,
  config,
  Constructor,
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  Provider,
  ValueOrPromise,
} from '@prisback/core';
import {
  AuthenticationBindings,
  TokenServiceBindings,
} from '../keys';
import {getAuthenticateMetadata} from '../decorators/authenticate.decorator';
import {TokenService, TokenServiceOptions, UserProfile} from '../types';

function unauthorized(message = 'Authorization required'): Error {
  return Object.assign(new Error(message), {
    statusCode: 401,
    status: 401,
    code: 'AUTHENTICATION_REQUIRED',
  });
}

/**
 * Global route interceptor: enforces `@authenticate()` via Bearer JWT.
 */
@injectable(asGlobalInterceptor('authentication'), {
  tags: {
    globalInterceptorSource: ['route'],
  },
})
export class AuthenticationInterceptorProvider implements Provider<Interceptor> {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE, {optional: true})
    private tokenService?: TokenService,
    @config({
      fromBinding: TokenServiceBindings.TOKEN_SERVICE,
      optional: true,
    })
    private tokenOptions?: TokenServiceOptions,
  ) {}

  value(): Interceptor {
    return async (invocationCtx, next) => this.intercept(invocationCtx, next);
  }

  private async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<unknown>,
  ) {
    const targetCtor = invocationCtx.targetClass as
      | Constructor<unknown>
      | undefined;
    const methodName = invocationCtx.methodName;
    if (!targetCtor || !methodName) {
      return next();
    }

    const metadata = getAuthenticateMetadata(targetCtor, methodName);
    if (!metadata?.length) {
      return next();
    }

    const request = this.getRequest(invocationCtx);
    const token = this.extractBearer(request);
    if (!token) {
      throw unauthorized('Missing Bearer token');
    }

    const tokenService = this.tokenService;
    if (!tokenService) {
      throw unauthorized('Token service is not configured');
    }

    let profile: UserProfile;
    try {
      profile = await tokenService.verifyToken(token);
    } catch {
      throw unauthorized('Invalid or expired token');
    }

    invocationCtx
      .bind(AuthenticationBindings.CURRENT_USER)
      .to(profile);
    return next();
  }

  private getRequest(
    invocationCtx: InvocationContext,
  ): {headers?: Record<string, unknown>} | undefined {
    try {
      return invocationCtx.getSync<{headers?: Record<string, unknown>}>(
        'rest.http.request',
        {optional: true},
      );
    } catch {
      return undefined;
    }
  }

  private extractBearer(
    request?: {headers?: Record<string, unknown>},
  ): string | undefined {
    const header = request?.headers?.authorization ?? request?.headers?.Authorization;
    if (typeof header !== 'string') return undefined;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1];
  }
}
