// Copyright IBM Corp. and LoopBack contributors 2019,2020. All Rights Reserved.
// Node module: @prisback/repository-json-schema
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {model, property} from '@prisback/repository';
import {expect} from '@prisback/testlab';
import {getJsonSchemaRef} from '../..';

describe('getJsonSchemaRef', () => {
  it('creates spec referencing shared model schema', () => {
    @model()
    class MyModel {
      @property()
      name: string;
    }

    const spec = getJsonSchemaRef(MyModel);

    expect(spec).to.deepEqual({
      $ref: '#/definitions/MyModel',
      definitions: {
        MyModel: {
          title: 'MyModel',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          additionalProperties: false,
        },
      },
    });
  });
});
