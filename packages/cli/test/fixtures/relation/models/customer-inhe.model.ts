import {model, property} from '@prisback/repository';
import {IdModel} from './id-model.model';

@model()
export class CustomerInheritance extends IdModel {
  @property({
    type: 'string',
  })
  name?: string;

  constructor(data?: Partial<CustomerInheritance>) {
    super(data);
  }
}
