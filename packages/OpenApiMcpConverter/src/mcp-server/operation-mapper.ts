import { OpenAPIV3 } from "openapi-types";
import camelcase from "camelcase";

export function generateMcpOperations(spec: OpenAPIV3.Document): string {
  let operationsCode = `
import { McpServer } from "./src/sdk/index.js";
import * as handlers from "./handlers.js";

export function registerOperations(server) {
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
      
      // Generate Zod schema for validation
      operationsCode += `
          {
            name: "${mcpOperationName}",
            description: ${JSON.stringify(operation.summary || `${httpMethod} ${path}`)},
            inputSchema: zodToJsonSchema(${mcpOperationName}Schema),
          },`;
    }
  }
  
  operationsCode += `
        ],
      };
    }
  );

  // Define Zod schemas
`;

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
    ${paramName}: ${zodType}.describe("${param.description || ''}"),`;
          } else {
            operationsCode += `
    ${paramName}: ${zodType}.optional().describe("${param.description || ''}"),`;
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
  });
`;
    }
  }
  
  // Add the call handler
  operationsCode += `
  // Handle tool calls
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      switch (request.params.name) {`;

  // Create case statements for each operation
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operationValue] of Object.entries(pathItem || {})) {
      if (method === 'parameters' || !operationValue) continue;
      
      const operation = operationValue as OpenAPIV3.OperationObject;
      const httpMethod = method.toUpperCase();
      const operationId = operation.operationId || generateOperationId(httpMethod, path);
      const mcpOperationName = camelcase(operationId);
      
      operationsCode += `
        case "${mcpOperationName}": {
          const args = ${mcpOperationName}Schema.parse(request.params.arguments);
          return await handlers.${mcpOperationName}Handler({ params: args });
        }`;
    }
  }
  
  operationsCode += `
        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: \`Unknown operation: \${request.params.name}\` }, null, 2)
              }
            ]
          };
      }
    }
  );
}`;
  
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
