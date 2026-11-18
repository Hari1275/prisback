// Copyright IBM Corp. and LoopBack contributors 2018,2020. All Rights Reserved.
// Node module: @prisback/repository-json-schema
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {MetadataAccessor} from '@prisback/core';
import {JsonSchema} from './index';

/**
 * Metadata key used to set or retrieve repository JSON Schema
 */
export const JSON_SCHEMA_KEY = MetadataAccessor.create<
  {[key: string]: JsonSchema},
  ClassDecorator
>('loopback:json-schema');
