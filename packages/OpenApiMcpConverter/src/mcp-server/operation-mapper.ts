import { OpenAPIV3 } from "openapi-types";
import camelcase from "camelcase";

export function generateMcpOperations(spec: OpenAPIV3.Document): string {
  let operationsCode = `
import { z } from "zod"; 
import { zodToJsonSchema } from "zod-to-json-schema";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as handlers from "./handlers.js";

export function registerOperations(server) {
  console.log("Registering MCP operations with server");

  // Set up request handler for listing tools
  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => {
      return {
        tools: [`;
  
  // Generate tools array
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operationValue] of Object.entries(pathItem || {})) {
      if (method === 'parameters' || !operationValue) continue;
      
      const operation = operationValue as OpenAPIV3.OperationObject;
      const httpMethod = method.toUpperCase();
      const operationId = operation.operationId || generateOperationId(httpMethod, path);
      const mcpOperationName = camelcase(operationId);
      
      operationsCode += `
          {
            name: "${mcpOperationName}",
            description: "${(operation.summary || `${httpMethod} ${path}`).replace(/"/g, '\\"')}",
            inputSchema: zodToJsonSchema(${mcpOperationName}Schema),
          },`;
    }
  }
  
  operationsCode += `
        ]
      };
    }
  );

  // Set up request handler for calling tools
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      switch (request.params.name) {`;
  
  // Generate case statements for each operation
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operationValue] of Object.entries(pathItem || {})) {
      if (method === 'parameters' || !operationValue) continue;
      
      const operation = operationValue as OpenAPIV3.OperationObject;
      const httpMethod = method.toUpperCase();
      const operationId = operation.operationId || generateOperationId(httpMethod, path);
      const mcpOperationName = camelcase(operationId);
      
      operationsCode += `
        case "${mcpOperationName}": {
          return handlers.${mcpOperationName}Handler(request);
        }`;
    }
  }
  
  operationsCode += `
        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: \`Unknown tool: \${request.params.name}\`
                }, null, 2)
              }
            ]
          };
      }
    }
  );
}

// Define Zod schemas for request validation`;

  // Create schemas for each operation
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operationValue] of Object.entries(pathItem || {})) {
      if (method === 'parameters' || !operationValue) continue;
      
      const operation = operationValue as OpenAPIV3.OperationObject;
      const httpMethod = method.toUpperCase();
      const operationId = operation.operationId || generateOperationId(httpMethod, path);
      const mcpOperationName = camelcase(operationId);
      
      operationsCode += `
const ${mcpOperationName}Schema = z.object({`;
      
      // Add parameters from the OpenAPI spec
      if (operation.parameters) {
        for (const paramValue of operation.parameters) {
          if ('$ref' in paramValue) continue;
          
          const param = paramValue as OpenAPIV3.ParameterObject;
          const paramName = camelcase(param.name);
          const zodType = mapOpenApiTypeToZod(param.schema as OpenAPIV3.SchemaObject);
          const required = param.required || false;
          
          if (required) {
            operationsCode += `
  ${paramName}: ${zodType}.describe("${(param.description || '').replace(/"/g, '\\"')}"),`;
          } else {
            operationsCode += `
  ${paramName}: ${zodType}.optional().describe("${(param.description || '').replace(/"/g, '\\"')}"),`;
          }
        }
      }
      
      // Handle request body if present
      if (operation.requestBody) {
        const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        
        operationsCode += `
  body: z.record(z.any())${requestBody.required ? '' : '.optional()'}.describe("Request body"),`;
      }
      
      operationsCode += `
});`;
    }
  }
  
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

function mapOpenApiTypeToZod(schema: OpenAPIV3.SchemaObject): string {
  if (!schema) return "z.any()";
  
  switch(schema.type) {
    case 'string':
      if (schema.enum && Array.isArray(schema.enum)) {
        const enumValues = schema.enum
          .filter(e => typeof e === 'string')
          .map(e => `"${e}"`)
          .join(', ');
        return `z.enum([${enumValues}])`;
      }
      return 'z.string()';
    case 'integer':
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'array':
      if (schema.items) {
        const itemType = mapOpenApiTypeToZod(schema.items as OpenAPIV3.SchemaObject);
        return `z.array(${itemType})`;
      }
      return 'z.array(z.any())';
    case 'object':
      return 'z.record(z.any())';
    default:
      return 'z.any()';
  }
}
