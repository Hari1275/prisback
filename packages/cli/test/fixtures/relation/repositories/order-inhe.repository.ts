import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbDataSource} from '../datasources';

export class OrderInheritanceRepository extends DefaultCrudRepository<
  OrderInheritance,
  typeof OrderInheritance.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(OrderInheritance, dataSource);
  }
}
