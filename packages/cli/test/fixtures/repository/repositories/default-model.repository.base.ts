// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @prisback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbmemDataSource} from '../datasources';
import {DefaultModel} from '../models';

export class DefaultModelRepository extends DefaultCrudRepository<
  DefaultModel,
  typeof DefaultModel.prototype.id
> {
  constructor(@inject('datasources.dbmem') dataSource: DbmemDataSource) {
    super(DefaultModel, dataSource);
  }
}
