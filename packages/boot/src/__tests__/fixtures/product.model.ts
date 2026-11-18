// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @prisback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, model, property} from '@prisback/repository';

@model()
export class Product extends Entity {
  @property({id: true})
  id: number;

  @property({required: true})
  name: string;
}
