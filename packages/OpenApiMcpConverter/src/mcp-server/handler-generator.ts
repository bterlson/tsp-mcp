import { OpenAPIV3 } from "openapi-types";
import camelcase from "camelcase"; // Fix import to use default import

export function generateOperationHandlers(spec: OpenAPIV3.Document, baseUrl: string): string {
  let handlersCode = `
import axios from "axios";
import * as types from "./types";

const BASE_URL = "${baseUrl.replace(/\/openapi\.json$|\/swagger\.json$/, '')}";

function buildUrl(path: string, params: Record<string, any>): string {
  let url = path;
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(\`{\${key}}\`, params[key]);
  });
  return \`\${BASE_URL}\${url}\`;
}

`;
  
  // Process each path in the OpenAPI spec
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    // Process each method (GET, POST, etc.) for the path
    for (const [method, operationValue] of Object.entries(pathItem || {})) {
      if (method === 'parameters' || !operationValue) continue;
      
      // Cast to specific type to avoid TypeScript errors
      const operation = operationValue as OpenAPIV3.OperationObject;
      const httpMethod = method.toUpperCase();
      const operationId = operation.operationId || generateOperationId(httpMethod, path);
      const mcpOperationName = camelcase(operationId);
      
      handlersCode += `
export async function ${mcpOperationName}Handler(params: Record<string, any>) {
  try {
    // Extract path parameters
    const pathParams: Record<string, any> = {};
`;
      
      // Handle path parameters
      if (operation.parameters) {
        for (const paramValue of operation.parameters) {
          // Skip ref parameters
          if ('$ref' in paramValue) continue;
          const param = paramValue as OpenAPIV3.ParameterObject;
          if (param.in === 'path') {
            handlersCode += `    pathParams["${param.name}"] = params.${camelcase(param.name)};\n`;
          }
        }
      }
      
      // Handle query parameters
      handlersCode += `
    // Build query parameters
    const queryParams: Record<string, any> = {};
`;
      
      if (operation.parameters) {
        for (const paramValue of operation.parameters) {
          if ('$ref' in paramValue) continue;
          const param = paramValue as OpenAPIV3.ParameterObject;
          if (param.in === 'query') {
            handlersCode += `    if (params.${camelcase(param.name)} !== undefined) queryParams["${param.name}"] = params.${camelcase(param.name)};\n`;
          }
        }
      }
      
      // Handle headers
      handlersCode += `
    // Set request headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
`;
      
      if (operation.parameters) {
        for (const paramValue of operation.parameters) {
          if ('$ref' in paramValue) continue;
          const param = paramValue as OpenAPIV3.ParameterObject;
          if (param.in === 'header') {
            handlersCode += `    if (params.${camelcase(param.name)} !== undefined) headers["${param.name}"] = params.${camelcase(param.name)};\n`;
          }
        }
      }
      
      // Handle request
      handlersCode += `
    // Build the URL
    const url = buildUrl("${path}", pathParams);
    
    // Make the request to the REST API
    const response = await axios({
      method: "${method}",
      url,
      params: queryParams,
      headers,`;
      
      // Add request body if needed
      if (operation.requestBody) {
        handlersCode += `
      data: params.body,`;
      }
      
      handlersCode += `
    });
    
    // Return the response data
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return {
        error: true,
        status: error.response.status,
        message: error.response.data.message || error.message,
        details: error.response.data
      };
    }
    return {
      error: true,
      message: error.message || String(error)
    };
  }
}
`;
    }
  }
  
  return handlersCode;
}

function generateOperationId(method: string, path: string): string {
  return method.toLowerCase() + 
    path.replace(/\/{([^}]+)}/g, 'By$1')
      .replace(/^\//, '')
      .split('/')
      .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
}
