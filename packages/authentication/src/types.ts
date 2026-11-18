/**
 * Metadata stored by `@authenticate()`.
 */
export interface AuthenticationMetadata {
  strategy: string;
  options?: object;
}

/**
 * JWT configuration.
 */
export interface TokenServiceOptions {
  secret: string;
  expiresIn?: string | number;
  issuer?: string;
}

/**
 * Minimal user profile carried in JWT and request context.
 */
export interface UserProfile {
  id: string | number;
  email?: string;
  [key: string]: unknown;
}

export interface TokenService {
  generateToken(user: UserProfile): Promise<string>;
  verifyToken(token: string): Promise<UserProfile>;
}

export interface PasswordHasher {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}
