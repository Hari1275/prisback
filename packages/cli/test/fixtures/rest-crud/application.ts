// Copyright IBM Corp. and LoopBack contributors 2020. All Rights Reserved.
// Node module: @prisback/example-rest-crud
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BootMixin} from '@prisback/boot';
import {ApplicationConfig} from '@prisback/core';
import {RepositoryMixin} from '@prisback/repository';
import {RestApplication} from '@prisback/rest';
import {RestExplorerComponent} from '@prisback/rest-explorer';
import path from 'path';
import {MySequence} from './sequence';

export class TodoApplication extends BootMixin(
  RepositoryMixin(RestApplication),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @prisback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
