import {expect} from '@prisback/testlab';
import {JWTService} from '../../services/jwt.service';
import {BcryptHasher} from '../../services/bcrypt.hasher';
import {
  authenticate,
  getAuthenticateMetadata,
} from '../../decorators/authenticate.decorator';

describe('JWTService', () => {
  const service = new JWTService({
    secret: 'test-secret',
    expiresIn: '1h',
  });

  it('generates and verifies a token', async () => {
    const token = await service.generateToken({
      id: 1,
      email: 'ada@example.com',
    });
    expect(token).to.be.a.String();
    const profile = await service.verifyToken(token);
    expect(profile.id).to.eql(1);
    expect(profile.email).to.eql('ada@example.com');
  });

  it('rejects invalid tokens', async () => {
    let threw = false;
    try {
      await service.verifyToken('not.a.token');
    } catch {
      threw = true;
    }
    expect(threw).to.eql(true);
  });
});

describe('BcryptHasher', () => {
  it('hashes and compares passwords', async () => {
    const hasher = new BcryptHasher(4);
    const hash = await hasher.hashPassword('secret');
    expect(hash).to.not.eql('secret');
    expect(await hasher.comparePassword('secret', hash)).to.eql(true);
    expect(await hasher.comparePassword('wrong', hash)).to.eql(false);
  });
});

describe('@authenticate()', () => {
  class DemoController {
    @authenticate('jwt')
    secure() {
      return 'ok';
    }

    open() {
      return 'open';
    }
  }

  it('stores metadata on secured methods', () => {
    const meta = getAuthenticateMetadata(DemoController, 'secure');
    expect(meta).to.eql([{strategy: 'jwt'}]);
    expect(getAuthenticateMetadata(DemoController, 'open')).to.be.undefined();
  });
});
