import {Constructor} from '@prisback/core';
import {
  isReferenceObject,
  RequestBodyObject,
  SchemaObject,
  TS_TYPE_KEY,
} from '@prisback/openapi-v3';
import {plainToInstance} from 'class-transformer';
import {validate, ValidationError as CvError} from 'class-validator';
import {RestHttpErrors} from '../rest-http-error';

export interface ClassValidationOptions {
  /**
   * Enable class-validator / class-transformer on DTO request bodies.
   * Default: `true`.
   */
  enabled?: boolean;
  /**
   * class-transformer options.
   */
  transformOptions?: Parameters<typeof plainToInstance>[2];
  /**
   * class-validator options.
   */
  validatorOptions?: Parameters<typeof validate>[1];
}

/**
 * Extract a DTO constructor from OpenAPI requestBody / schema metadata.
 */
export function extractDtoClass(
  schema?: SchemaObject | { $ref?: string; [key: string]: unknown },
  requestBodySpec?: RequestBodyObject,
): Constructor<object> | undefined {
  const fromBody = requestBodySpec?.[TS_TYPE_KEY as keyof RequestBodyObject] as
    | Constructor<object>
    | undefined;
  if (typeof fromBody === 'function') return fromBody;

  if (requestBodySpec?.content) {
    for (const media of Object.values(requestBodySpec.content)) {
      const mediaType = media as Record<string, unknown>;
      const fromMedia = mediaType[TS_TYPE_KEY];
      if (typeof fromMedia === 'function') {
        return fromMedia as Constructor<object>;
      }
      const mediaSchema = media.schema;
      if (mediaSchema && !isReferenceObject(mediaSchema)) {
        const fromSchema = (mediaSchema as SchemaObject & {
          [TS_TYPE_KEY]?: Constructor<object>;
        })[TS_TYPE_KEY];
        if (typeof fromSchema === 'function') return fromSchema;
      }
    }
  }

  if (schema && !isReferenceObject(schema)) {
    const fromSchema = (schema as SchemaObject & {
      [TS_TYPE_KEY]?: Constructor<object>;
    })[TS_TYPE_KEY];
    if (typeof fromSchema === 'function') return fromSchema;
  }

  return undefined;
}

function flattenErrors(
  errors: CvError[],
  parentPath = '',
): RestHttpErrors.ValidationErrorDetails[] {
  const details: RestHttpErrors.ValidationErrorDetails[] = [];
  for (const err of errors) {
    const path = parentPath
      ? `${parentPath}.${err.property}`
      : `/${err.property}`;
    if (err.constraints) {
      for (const [code, message] of Object.entries(err.constraints)) {
        details.push({
          path,
          code,
          message,
          info: err.contexts?.[code] ?? {},
        });
      }
    }
    if (err.children?.length) {
      details.push(...flattenErrors(err.children, path.replace(/^\//, '')));
    }
  }
  return details;
}

/**
 * Transform a plain body into a DTO instance and validate with class-validator.
 * Returns the transformed instance, or throws 422 on failure.
 */
export async function applyClassValidationPipe<T extends object>(
  value: unknown,
  dtoClass: Constructor<T>,
  options: ClassValidationOptions = {},
): Promise<T> {
  if (options.enabled === false) {
    return value as T;
  }

  const instance = plainToInstance(
    dtoClass,
    value,
    options.transformOptions ?? {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    },
  );

  const errors = await validate(
    instance as object,
    options.validatorOptions ?? {
      whitelist: true,
      forbidUnknownValues: false,
    },
  );

  if (errors.length) {
    throw RestHttpErrors.invalidRequestBody(flattenErrors(errors));
  }

  return instance;
}
