import {BindingScope, injectable} from '@prisback/core';
import bcrypt from 'bcryptjs';
import {PasswordHasher} from '../types';

@injectable({scope: BindingScope.SINGLETON})
export class BcryptHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
