import { OpenAPIV3 } from "openapi-types";
import camelcase from "camelcase"; // Fix import

export function generateTypeScriptInterfaces(spec: OpenAPIV3.Document): string {
  let typesCode = `// Generated TypeScript interfaces for API types\n\n`;
  
  // Process schemas if they exist
  if (spec.components && spec.components.schemas) {
    for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
      typesCode += generateInterface(schemaName, schema as OpenAPIV3.SchemaObject);
    }
  }
  
  // Generate request/response types for each operation
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operationValue] of Object.entries(pathItem || {})) {
      if (method === 'parameters' || !operationValue) continue;
      
      // Cast to specific type
      const operation = operationValue as OpenAPIV3.OperationObject;
      const operationId = operation.operationId || generateOperationId(method.toUpperCase(), path);
      
      // Generate request type if there's a request body
      if (operation.requestBody) {
        const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        if (requestBody.content) {
          const contentType = Object.keys(requestBody.content)[0];
          if (contentType && requestBody.content[contentType].schema) {
            const schema = requestBody.content[contentType].schema as OpenAPIV3.SchemaObject;
            typesCode += generateInterface(`${operationId}Request`, schema);
          }
        }
      }
      
      // Generate response types for each response
      if (operation.responses) {
        for (const [statusCode, responseValue] of Object.entries(operation.responses)) {
          if (!responseValue) continue;
          
          // Handle both reference and response objects
          const response = responseValue as OpenAPIV3.ResponseObject;
          
          if (response.content) {
            const contentType = Object.keys(response.content)[0];
            if (contentType && response.content[contentType].schema) {
              const schema = response.content[contentType].schema as OpenAPIV3.SchemaObject;
              typesCode += generateInterface(`${operationId}Response${statusCode}`, schema);
            }
          }
        }
      }
    }
  }
  
  return typesCode;
}

function generateInterface(name: string, schema: OpenAPIV3.SchemaObject): string {
  if (!schema) return '';
  
  let interfaceCode = `export interface ${camelcase(name, {pascalCase: true})} {\n`;
  
  // Handle properties if schema is an object
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(propName) || false;
      const propType = getTypeScriptType(propSchema as OpenAPIV3.SchemaObject);
      const optionalFlag = isRequired ? '' : '?';
      
      interfaceCode += `  ${propName}${optionalFlag}: ${propType};\n`;
    }
  }
  
  interfaceCode += '}\n\n';
  return interfaceCode;
}

function getTypeScriptType(schema: OpenAPIV3.SchemaObject): string {
  if (!schema) return 'any';
  
  // Handle references
  if ('$ref' in schema && typeof schema.$ref === 'string') {
    const refPath = schema.$ref;
    const refName = refPath.split('/').pop() || '';
    return camelcase(refName, {pascalCase: true});
  }
  
  // Handle different types
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map(e => typeof e === 'string' ? `'${e}'` : e).join(' | ');
      }
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      if (schema.items) {
        const itemType = getTypeScriptType(schema.items as OpenAPIV3.SchemaObject);
        return `${itemType}[]`;
      }
      return 'any[]';
    case 'object':
    default:
      if (schema.additionalProperties) {
        const valueType = getTypeScriptType(schema.additionalProperties as OpenAPIV3.SchemaObject);
        return `Record<string, ${valueType}>`;
      }
      return 'Record<string, any>';
  }
}

function generateOperationId(method: string, path: string): string {
  return method.toLowerCase() + 
    path.replace(/\/{([^}]+)}/g, 'By$1')
      .replace(/^\//, '')
      .split('/')
      .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
}
