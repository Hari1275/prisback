import {BindingScope, config, injectable} from '@prisback/core';
import jwt from 'jsonwebtoken';
import {TokenServiceBindings} from '../keys';
import {TokenService, TokenServiceOptions, UserProfile} from '../types';

const DEFAULT_OPTIONS: TokenServiceOptions = {
  secret: process.env.JWT_SECRET || 'prisback-dev-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

@injectable({scope: BindingScope.SINGLETON})
export class JWTService implements TokenService {
  private readonly options: TokenServiceOptions;

  constructor(
    @config({fromBinding: TokenServiceBindings.TOKEN_SERVICE, optional: true})
    options?: TokenServiceOptions,
  ) {
    this.options = {...DEFAULT_OPTIONS, ...options};
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    const payload = {
      id: userProfile.id,
      email: userProfile.email,
    };
    const signOptions: jwt.SignOptions = {};
    if (this.options.expiresIn != null) {
      signOptions.expiresIn = this.options
        .expiresIn as jwt.SignOptions['expiresIn'];
    }
    if (this.options.issuer) {
      signOptions.issuer = this.options.issuer;
    }
    return jwt.sign(payload, this.options.secret, signOptions);
  }

  async verifyToken(token: string): Promise<UserProfile> {
    const decoded = jwt.verify(token, this.options.secret, {
      issuer: this.options.issuer,
    }) as jwt.JwtPayload;
    if (decoded == null || typeof decoded !== 'object') {
      throw Object.assign(new Error('Invalid token'), {statusCode: 401});
    }
    const id = decoded.id ?? decoded.sub;
    if (id == null) {
      throw Object.assign(new Error('Invalid token payload'), {statusCode: 401});
    }
    return {
      id,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      ...decoded,
    };
  }
}
