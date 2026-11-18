import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbDataSource} from '../datasources';
import {Friend} from '../models';

export class FriendRepository extends DefaultCrudRepository<
  Friend,
  typeof Friend.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Friend, dataSource);
  }
}
