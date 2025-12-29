
import { SchemaObject } from '../core/types';

export class TypeMapper {
  /**
   * Map Swagger/OpenAPI type to TypeScript type
   */
 static mapSwaggerTypeToTS(schema: SchemaObject): string {
    // Handle enum
    if (schema.enum) {
      return schema.enum.map(v => `'${v}'`).join(' | ');
    }

    switch (schema.type) {
      case 'string':
        return this.mapStringType(schema);
      
      case 'number':
      case 'integer':
        return 'number';
      
      case 'boolean':
        return 'boolean';
      
      case 'array':
        if (schema.items) {
          const itemType = this.mapSwaggerTypeToTS(schema.items);
          return `${itemType}[]`;
        }
        return 'any[]';
      
      case 'object':
        // ✅ CHANGED - Don't generate inline object types
        // They should be handled by SchemaParser as separate interfaces
        
        // Has additionalProperties - Record type
        if (schema.additionalProperties) {
          if (typeof schema.additionalProperties === 'object') {
            const valueType = this.mapSwaggerTypeToTS(schema.additionalProperties);
            return `Record<string, ${valueType}>`;
          }
          return 'Record<string, any>';
        }
        
        // Has properties but called from basic context - warn and use Record
        if (schema.properties && Object.keys(schema.properties).length > 0) {
          console.warn('Object with properties should be handled by SchemaParser');
          return 'Record<string, any>';
        }
        
        // Empty object
        return 'Record<string, any>';
      
      default:
        return 'any';
    }
  }

  /**
   * Map string type with format
   */
  private static mapStringType(schema: SchemaObject): string {
    switch (schema.format) {
      case 'date':
      case 'date-time':
        return 'string'; // or Date if you prefer
      
      case 'binary':
      case 'byte':
        return 'string';
      
      case 'email':
      case 'uuid':
      case 'uri':
      case 'hostname':
      case 'ipv4':
      case 'ipv6':
        return 'string';
      
      default:
        return 'string';
    }
  }
}