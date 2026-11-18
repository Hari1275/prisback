// Copyright IBM Corp. and LoopBack contributors 2020. All Rights Reserved.
// Node module: @prisback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject} from '@prisback/core';
import {DefaultCrudRepository, juggler} from '@prisback/repository';
import {Product} from './product.model';

export class ProductRepository extends DefaultCrudRepository<
  Product,
  typeof Product.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: juggler.DataSource) {
    super(Product, dataSource);
  }
}
