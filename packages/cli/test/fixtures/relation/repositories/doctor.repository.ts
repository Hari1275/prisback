import {DefaultCrudRepository} from '@prisback/repository';
import {Doctor} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@prisback/core';

export class DoctorRepository extends DefaultCrudRepository<
  Doctor,
  typeof Doctor.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Doctor, dataSource);
  }
}
