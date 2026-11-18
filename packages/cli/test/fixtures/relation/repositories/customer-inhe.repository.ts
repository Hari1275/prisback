import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbDataSource} from '../datasources';
import {CustomerInheritance} from '../models';

export class CustomerInheritanceRepository extends DefaultCrudRepository<
  CustomerInheritance,
  typeof CustomerInheritance.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(CustomerInheritance, dataSource);
  }
}
