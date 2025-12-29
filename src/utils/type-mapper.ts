import { SchemaObject } from '../core/types';

export class TypeMapper {
  static mapSwaggerTypeToTS(schema: SchemaObject): string {
    if (schema.$ref) {
      return schema.$ref.split('/').pop()!;
    }

    if (schema.allOf) {
      return schema.allOf.map(s => this.mapSwaggerTypeToTS(s)).join(' & ');
    }

    if (schema.oneOf) {
      return schema.oneOf.map(s => this.mapSwaggerTypeToTS(s)).join(' | ');
    }

    switch (schema.type) {
      case 'string':
        return schema.enum 
          ? schema.enum.map(e => `'${e}'`).join(' | ') 
          : 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return schema.items 
          ? `${this.mapSwaggerTypeToTS(schema.items)}[]` 
          : 'any[]';
      case 'object':
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }
}