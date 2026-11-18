import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbDataSource} from '../datasources';
import {User} from '../models';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(User, dataSource);
  }
}
