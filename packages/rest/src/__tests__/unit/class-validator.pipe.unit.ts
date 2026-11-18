import {expect} from '@prisback/testlab';
import {IsEmail, IsOptional, IsString, MinLength} from 'class-validator';
import {TS_TYPE_KEY} from '@prisback/openapi-v3';
import {
  applyClassValidationPipe,
  extractDtoClass,
} from '../../validation/class-validator.pipe';

class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

describe('class-validator ValidationPipe', () => {
  it('extracts DTO class from schema x-ts-type', () => {
    const cls = extractDtoClass({
      type: 'object',
      [TS_TYPE_KEY]: CreateUserDto,
    } as never);
    expect(cls).to.equal(CreateUserDto);
  });

  it('transforms and returns a valid DTO instance', async () => {
    const result = await applyClassValidationPipe(
      {name: 'Ada', email: 'ada@example.com'},
      CreateUserDto,
    );
    expect(result).to.be.instanceOf(CreateUserDto);
    expect(result.name).to.eql('Ada');
    expect(result.email).to.eql('ada@example.com');
  });

  it('throws 422 VALIDATION_FAILED for invalid payload', async () => {
    try {
      await applyClassValidationPipe(
        {name: 'A', email: 'not-an-email'},
        CreateUserDto,
      );
      throw new Error('expected validation to fail');
    } catch (err: unknown) {
      const error = err as {
        statusCode?: number;
        status?: number;
        code?: string;
        details?: unknown[];
      };
      expect(error.statusCode ?? error.status).to.eql(422);
      expect(error.code).to.eql('VALIDATION_FAILED');
      expect(error.details).to.be.Array();
      expect((error.details ?? []).length).to.be.greaterThan(0);
    }
  });

  it('skips validation when enabled is false', async () => {
    const raw = {name: 'A', email: 'bad'};
    const result = await applyClassValidationPipe(raw, CreateUserDto, {
      enabled: false,
    });
    expect(result).to.equal(raw);
  });
});
