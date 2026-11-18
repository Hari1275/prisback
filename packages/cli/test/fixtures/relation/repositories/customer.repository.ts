import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbDataSource} from '../datasources';
import {Customer} from '../models';

export class CustomerRepository extends DefaultCrudRepository<
  Customer,
  typeof Customer.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Customer, dataSource);
  }
}
