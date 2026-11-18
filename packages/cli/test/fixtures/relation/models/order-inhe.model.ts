import {model, property} from '@prisback/repository';
import {IdModel} from './id-model.model';

@model()
export class OrderInheritance extends IdModel {
  @property({
    type: 'string',
  })
  des?: string;

  constructor(data?: Partial<OrderInheritance>) {
    super(data);
  }
}
