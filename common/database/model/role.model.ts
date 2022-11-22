import { Schema } from '../connect.ts';
import { AttributeModel } from './attribute.model.ts';

export interface RoleModel extends Schema {
  rid: string;
  name: string;
  description: string;
  attribute: AttributeModel[];
}
