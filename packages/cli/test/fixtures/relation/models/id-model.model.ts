import {Entity, model, property} from '@prisback/repository';

@model()
export class IdModel extends Entity {
  @property({
    type: 'number',
    id: true,
    default: 0,
  })
  id?: string;

  constructor(data?: Partial<IdModel>) {
    super(data);
  }
}
