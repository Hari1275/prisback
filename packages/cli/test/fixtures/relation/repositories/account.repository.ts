import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbDataSource} from '../datasources';
import {Account} from '../models';

export class AccountRepository extends DefaultCrudRepository<
  Account,
  typeof Account.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Account, dataSource);
  }
}
