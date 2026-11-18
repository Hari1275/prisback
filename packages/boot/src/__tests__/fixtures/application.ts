// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @prisback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ApplicationConfig} from '@prisback/core';
import {RepositoryMixin} from '@prisback/repository';
import {RestApplication} from '@prisback/rest';
import {ServiceMixin} from '@prisback/service-proxy';
import {BootMixin} from '../..';

export class BooterApp extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options?: ApplicationConfig) {
    super(options);
    this.projectRoot = __dirname;
  }
}
