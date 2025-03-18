import { OpenAPIV3 } from "openapi-types";
import camelcase from "camelcase"; // Fix import

export function generateMcpOperations(spec: OpenAPIV3.Document): string {
  let operationsCode = `
import { McpServer } from "@modelcontextprotocol/sdk";
import * as handlers from "./handlers";
import * as types from "./types";

export function registerOperations(server: McpServer) {
  `;
  
  // Process each path in the OpenAPI spec
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    // Process each method (GET, POST, etc.) for the path
    for (const [method, operationValue] of Object.entries(pathItem || {})) {
      if (method === 'parameters' || !operationValue) continue; // Skip non-operation properties
      
      // Cast to specific type
      const operation = operationValue as OpenAPIV3.OperationObject;
      const httpMethod = method.toUpperCase();
      const operationId = operation.operationId || generateOperationId(httpMethod, path);
      const mcpOperationName = camelcase(operationId);
      
      operationsCode += `
  server.addOperation({
    name: "${mcpOperationName}",
    description: ${JSON.stringify(operation.summary || `${httpMethod} ${path}`)},
    parameters: {`;
      
      // Add parameters from the OpenAPI spec
      if (operation.parameters) {
        for (const paramValue of operation.parameters) {
          if ('$ref' in paramValue) continue; // Skip references for simplicity
          
          const param = paramValue as OpenAPIV3.ParameterObject;
          const paramName = camelcase(param.name);
          operationsCode += `
      ${paramName}: {
        type: "${mapOpenApiTypeToMcpType(param.schema as OpenAPIV3.SchemaObject)}",
        description: ${JSON.stringify(param.description || '')},
        required: ${param.required || false}
      },`;
        }
      }
      
      // Handle request body if present
      if (operation.requestBody) {
        const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        const contentType = Object.keys(requestBody.content)[0];
        const schema = requestBody.content[contentType].schema as OpenAPIV3.SchemaObject;
        
        operationsCode += `
      body: {
        type: "object",
        description: "Request body",
        required: ${requestBody.required || false}
      },`;
      }
      
      operationsCode += `
    },
    handler: handlers.${mcpOperationName}Handler
  });
`;
    }
  }
  
  operationsCode += `
}
`;
  
  return operationsCode;
}

function generateOperationId(method: string, path: string): string {
  // Convert path like /pets/{petId} to getPetById
  return method.toLowerCase() + 
    path.replace(/\/{([^}]+)}/g, 'By$1')
      .replace(/^\//, '')
      .split('/')
      .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
}

function mapOpenApiTypeToMcpType(schema: OpenAPIV3.SchemaObject): string {
  if (!schema) return "any";
  
  switch(schema.type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
    default:
      return 'object';
  }
}
