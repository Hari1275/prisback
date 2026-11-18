import {DefaultCrudRepository} from '@prisback/repository';
import {Patient} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@prisback/core';

export class PatientRepository extends DefaultCrudRepository<
  Patient,
  typeof Patient.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Patient, dataSource);
  }
}
