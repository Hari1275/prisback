import {Entity, model, property} from '@prisback/repository';

@model()
export class Customer extends Entity {
  @property({
    type: 'number',
    id: true,
    default: 0,
  })
  id?: number;

  @property({
    type: 'string',
  })
  name?: string;

  constructor(data?: Partial<Customer>) {
    super(data);
  }
}
