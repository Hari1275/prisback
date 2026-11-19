'use strict';

const {modelNames} = require('../naming');

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

export class RefreshDto {
  @IsString()
  refreshToken!: string;
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
  TokenPair,
  TokenService,
  TokenServiceBindings,
  UserProfile,
} from '@prisback/authentication';
import {injectPrisma, PrismaService} from '@prisback/prisma';
import {LoginDto, RegisterDto} from './auth.dto';

function publicUser(user: {id: unknown; email?: string; roles?: string[]}): UserProfile {
  return {
    id: user.id as string | number,
    email: user.email,
    roles: Array.isArray(user.roles) ? user.roles : ['user'],
  };
}

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

  async login(credentials: LoginDto): Promise<TokenPair & {user: UserProfile}> {
    const user = await this.users.findUnique({where: {email: credentials.email}});
    if (!user?.password) {
      throw Object.assign(new Error('Invalid email or password'), {statusCode: 401});
    }
    const ok = await this.passwordHasher.comparePassword(
      credentials.password,
      user.password,
    );
    if (!ok) {
      throw Object.assign(new Error('Invalid email or password'), {statusCode: 401});
    }
    const profile = publicUser(user);
    const tokens = await this.tokenService.generateTokenPair(profile);
    return {...tokens, user: profile};
  }

  async register(data: RegisterDto): Promise<TokenPair & {user: UserProfile}> {
    const password = await this.passwordHasher.hashPassword(data.password);
    const user = await this.users.create({
      data: {
        email: data.email,
        password,
        roles: ['user'],
        ...(data.name ? {name: data.name} : {}),
      },
    });
    const profile = publicUser(user);
    const tokens = await this.tokenService.generateTokenPair(profile);
    return {...tokens, user: profile};
  }

  async refresh(refreshToken: string): Promise<TokenPair & {user: UserProfile}> {
    const profile = await this.tokenService.verifyRefreshToken(refreshToken);
    // Re-issue pair (rotation). Callers should discard the old refresh token.
    const tokens = await this.tokenService.generateTokenPair(profile);
    return {...tokens, user: profile};
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
import {LoginDto, RefreshDto${registerImport}} from './auth.dto';
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

  @post('/refresh')
  async refresh(@requestBody() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
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
JWT_REFRESH_EXPIRES_IN=7d
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
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
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
};
