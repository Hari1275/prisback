// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @prisback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {juggler} from '@prisback/repository';

export class DbDataSource extends juggler.DataSource {
  static dataSourceName = 'db';

  constructor() {
    super({name: 'db'});
  }
}
