import {DefaultCrudRepository, BelongsToAccessor} from '@prisback/repository';
import {Address, Customer} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@prisback/core';

export class AddressRepository extends DefaultCrudRepository<
  Address,
  typeof Address.prototype.id
> {
  public readonly myCustomer: BelongsToAccessor<
    Customer,
    typeof Address.prototype.id
  >;
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Address, dataSource);
  }
}
