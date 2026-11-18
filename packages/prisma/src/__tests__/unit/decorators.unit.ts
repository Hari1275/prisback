import {expect} from '@prisback/testlab';
import {injectPrisma, repository} from '../..';

describe('decorators', () => {
  it('injectPrisma and repository are callable decorator factories', () => {
    expect(typeof injectPrisma).to.eql('function');
    expect(typeof repository).to.eql('function');
    expect(typeof injectPrisma()).to.eql('function');
    expect(typeof repository()).to.eql('function');
  });
});
