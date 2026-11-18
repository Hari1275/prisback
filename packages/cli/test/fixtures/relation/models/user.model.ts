import {Entity, model, property} from '@prisback/repository';

@model()
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    default: 0,
  })
  id?: number;

  @property({
    type: 'string',
  })
  email?: string;

  constructor(data?: Partial<User>) {
    super(data);
  }
}
