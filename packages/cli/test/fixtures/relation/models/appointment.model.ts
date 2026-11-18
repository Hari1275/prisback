import {Entity, model, property} from '@prisback/repository';

@model()
export class Appointment extends Entity {
  @property({
    type: 'number',
    id: true,
    default: 0,
  })
  id?: number;

  @property({
    type: 'string',
  })
  des?: string;

  constructor(data?: Partial<Appointment>) {
    super(data);
  }
}
