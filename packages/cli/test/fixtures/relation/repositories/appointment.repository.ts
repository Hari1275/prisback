import {DefaultCrudRepository} from '@prisback/repository';
import {Appointment} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@prisback/core';

export class AppointmentRepository extends DefaultCrudRepository<
  Appointment,
  typeof Appointment.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Appointment, dataSource);
  }
}
