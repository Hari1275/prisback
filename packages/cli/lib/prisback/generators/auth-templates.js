'use strict';

const {modelNames, camelCase} = require('../naming');

function generateAuthDto() {
  return `import {IsEmail, IsString, MinLength} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  name?: string;
}
`;
}

function generateAuthService({userModel}) {
  const names = modelNames(userModel);
  const delegate = names.camel;
  return `import {BindingScope, inject, injectable} from '@prisback/core';
import {
  PasswordHasher,
  PasswordHasherBindings,
  TokenService,
  TokenServiceBindings,
  UserProfile,
} from '@prisback/authentication';
import {injectPrisma, PrismaService} from '@prisback/prisma';
import {LoginDto, RegisterDto} from './auth.dto';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @injectPrisma() private readonly prisma: PrismaService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  private get users() {
    return (this.prisma.client as any).${delegate};
  }

  async login(credentials: LoginDto): Promise<{token: string; user: UserProfile}> {
    const user = await this.users.findUnique({where: {email: credentials.email}});
    if (!user?.password) {
      const err = Object.assign(new Error('Invalid email or password'), {
        statusCode: 401,
      });
      throw err;
    }
    const ok = await this.passwordHasher.comparePassword(
      credentials.password,
      user.password,
    );
    if (!ok) {
      const err = Object.assign(new Error('Invalid email or password'), {
        statusCode: 401,
      });
      throw err;
    }
    const profile: UserProfile = {id: user.id, email: user.email};
    const token = await this.tokenService.generateToken(profile);
    return {token, user: profile};
  }

  async register(data: RegisterDto): Promise<{token: string; user: UserProfile}> {
    const password = await this.passwordHasher.hashPassword(data.password);
    const user = await this.users.create({
      data: {
        email: data.email,
        password,
        ...(data.name ? {name: data.name} : {}),
      },
    });
    const profile: UserProfile = {id: user.id, email: user.email};
    const token = await this.tokenService.generateToken(profile);
    return {token, user: profile};
  }
}
`;
}

function generateAuthController({includeRegister}) {
  const registerBlock = includeRegister
    ? `
  @post('/register')
  async register(@requestBody() body: RegisterDto) {
    return this.authService.register(body);
  }
`
    : '';

  const registerImport = includeRegister ? ', RegisterDto' : '';

  return `import {inject} from '@prisback/core';
import {authenticate} from '@prisback/authentication';
import {api, get, post, requestBody} from '@prisback/rest';
import {LoginDto${registerImport}} from './auth.dto';
import {AuthService} from './auth.service';

@api({basePath: '/auth', paths: {}})
export class AuthController {
  constructor(
    @inject('services.AuthService')
    public authService: AuthService,
  ) {}

  @post('/login')
  async login(@requestBody() body: LoginDto) {
    return this.authService.login(body);
  }
${registerBlock}
  @authenticate('jwt')
  @get('/me')
  async me(@inject('prisback.authentication.currentUser') user: object) {
    return user;
  }
}
`;
}

function generateAuthModule({includeRegister}) {
  return `import {Module} from '@prisback/core';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
`;
}

function generateEnvExample() {
  return `# JWT (prisback g auth)
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1h
`;
}

function generateAppSnippet() {
  return `// Add to your Application constructor:
import {AuthenticationComponent, TokenServiceBindings} from '@prisback/authentication';
import {AuthModule} from './modules/auth/auth.module';

this.component(AuthenticationComponent);
this.configure(TokenServiceBindings.TOKEN_SERVICE).to({
  secret: process.env.JWT_SECRET ?? 'prisback-dev-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
});
this.component(AuthModule);
`;
}

module.exports = {
  generateAuthDto,
  generateAuthService,
  generateAuthController,
  generateAuthModule,
  generateEnvExample,
  generateAppSnippet,
  camelCase,
};
