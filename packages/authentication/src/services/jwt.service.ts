import {BindingScope, config, injectable} from '@prisback/core';
import jwt from 'jsonwebtoken';
import {TokenServiceBindings} from '../keys';
import {
  TokenPair,
  TokenService,
  TokenServiceOptions,
  UserProfile,
} from '../types';

const DEFAULT_OPTIONS: TokenServiceOptions = {
  secret: process.env.JWT_SECRET || 'prisback-dev-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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

  private profilePayload(userProfile: UserProfile) {
    return {
      id: userProfile.id,
      email: userProfile.email,
      roles: userProfile.roles ?? [],
    };
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    const signOptions: jwt.SignOptions = {};
    if (this.options.expiresIn != null) {
      signOptions.expiresIn = this.options
        .expiresIn as jwt.SignOptions['expiresIn'];
    }
    if (this.options.issuer) {
      signOptions.issuer = this.options.issuer;
    }
    return jwt.sign(this.profilePayload(userProfile), this.options.secret, signOptions);
  }

  async generateRefreshToken(userProfile: UserProfile): Promise<string> {
    const signOptions: jwt.SignOptions = {subject: 'refresh'};
    if (this.options.refreshExpiresIn != null) {
      signOptions.expiresIn = this.options
        .refreshExpiresIn as jwt.SignOptions['expiresIn'];
    }
    if (this.options.issuer) {
      signOptions.issuer = this.options.issuer;
    }
    return jwt.sign(
      {...this.profilePayload(userProfile), typ: 'refresh'},
      this.options.secret,
      signOptions,
    );
  }

  async generateTokenPair(userProfile: UserProfile): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(userProfile),
      this.generateRefreshToken(userProfile),
    ]);
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.options.expiresIn ?? '1h',
    };
  }

  private decodeProfile(token: string, expectRefresh = false): UserProfile {
    const decoded = jwt.verify(token, this.options.secret, {
      issuer: this.options.issuer,
    }) as jwt.JwtPayload;
    if (decoded == null || typeof decoded !== 'object') {
      throw Object.assign(new Error('Invalid token'), {statusCode: 401});
    }
    const isRefresh = decoded.typ === 'refresh' || decoded.sub === 'refresh';
    if (expectRefresh && !isRefresh) {
      throw Object.assign(new Error('Refresh token required'), {statusCode: 401});
    }
    if (!expectRefresh && isRefresh) {
      throw Object.assign(new Error('Access token required'), {statusCode: 401});
    }
    const id = decoded.id ?? (expectRefresh ? undefined : decoded.sub);
    if (id == null || id === 'refresh') {
      throw Object.assign(new Error('Invalid token payload'), {statusCode: 401});
    }
    const roles = Array.isArray(decoded.roles)
      ? decoded.roles.filter((r): r is string => typeof r === 'string')
      : undefined;
    return {
      id,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      roles,
    };
  }

  async verifyToken(token: string): Promise<UserProfile> {
    return this.decodeProfile(token, false);
  }

  async verifyRefreshToken(token: string): Promise<UserProfile> {
    return this.decodeProfile(token, true);
  }
}
