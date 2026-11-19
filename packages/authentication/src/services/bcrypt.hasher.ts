import {BindingScope, injectable} from '@prisback/core';
import bcrypt from 'bcryptjs';
import {PasswordHasher} from '../types';

@injectable({scope: BindingScope.SINGLETON})
export class BcryptHasher implements PasswordHasher {
  /** Default cost 12 — suitable for production password hashing. */
  constructor(private readonly rounds = 12) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
