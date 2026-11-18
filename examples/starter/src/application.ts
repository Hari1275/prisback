import {BootMixin} from '@prisback/boot';
import {ApplicationConfig} from '@prisback/core';
import {
  AuthenticationComponent,
  TokenServiceBindings,
} from '@prisback/authentication';
import {PrismaBindings, PrismaComponent} from '@prisback/prisma';
import {RestApplication} from '@prisback/rest';
import {PrismaClient} from '@prisma/client';
import path from 'path';

export {ApplicationConfig};

export class StarterApplication extends BootMixin(RestApplication) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Prisma
    this.bind(PrismaBindings.CLIENT).to(new PrismaClient());
    this.component(PrismaComponent);

    // JWT (optional — run `prisback g auth` for full auth module)
    this.component(AuthenticationComponent);
    this.configure(TokenServiceBindings.TOKEN_SERVICE).to({
      secret: process.env.JWT_SECRET ?? 'prisback-dev-secret-change-me',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    });

    // Static public folder (optional)
    this.static('/', path.join(__dirname, '../public'));
  }
}
