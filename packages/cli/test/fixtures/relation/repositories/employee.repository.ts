import {inject} from '@prisback/core';
import {DefaultCrudRepository} from '@prisback/repository';
import {DbDataSource} from '../datasources';
import {Employee} from '../models';

export class EmployeeRepository extends DefaultCrudRepository<
  Employee,
  typeof Employee.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Employee, dataSource);
  }
}
