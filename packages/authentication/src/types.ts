/**
 * Metadata stored by `@authenticate()`.
 */
export interface AuthenticationMetadata {
  strategy: string;
  options?: object;
}

/**
 * Metadata stored by `@authorize()`.
 */
export interface AuthorizationMetadata {
  roles: string[];
}

/**
 * JWT configuration.
 */
export interface TokenServiceOptions {
  secret: string;
  expiresIn?: string | number;
  /** Refresh token TTL (default 7d). */
  refreshExpiresIn?: string | number;
  issuer?: string;
}

/**
 * Minimal user profile carried in JWT and request context.
 */
export interface UserProfile {
  id: string | number;
  email?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string | number;
}

export interface TokenService {
  generateToken(user: UserProfile): Promise<string>;
  generateRefreshToken(user: UserProfile): Promise<string>;
  generateTokenPair(user: UserProfile): Promise<TokenPair>;
  verifyToken(token: string): Promise<UserProfile>;
  verifyRefreshToken(token: string): Promise<UserProfile>;
}

export interface PasswordHasher {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}
