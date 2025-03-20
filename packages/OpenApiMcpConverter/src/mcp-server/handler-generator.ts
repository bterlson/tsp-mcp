import { OpenAPIV3 } from "openapi-types";
import camelcase from "camelcase";

export function generateOperationHandlers(spec: OpenAPIV3.Document, baseUrl: string): string {
  // Check if the spec has a servers array that defines the actual API base URL
  let apiBaseUrl = baseUrl.replace(/\/+openapi\.json$|\/+swagger\.json$|\/+api-docs\.json$/i, '');
  
  // Extract a proper base URL from the spec if available
  if (spec.servers && spec.servers.length > 0) {
    // Use the first server URL from the spec
    apiBaseUrl = spec.servers[0].url;
    console.log(`Using server URL from OpenAPI spec: ${apiBaseUrl}`);
  } else {
    console.log(`No servers defined in spec, using derived URL: ${apiBaseUrl}`);
  }

  let handlersCode = `
import axios from "axios";
import { z } from "zod";

// Base URL for API requests - extracted from OpenAPI spec
const BASE_URL = "${apiBaseUrl}";
console.log('Using API base URL:', BASE_URL);

// Enhanced URL building with complete debugging
function buildUrl(path, params = {}) {
  // Start with the path as provided
  let url = path;
  
  // Log original components
  console.log('Building URL with path:', path);
  console.log('Path parameters:', JSON.stringify(params));
  
  // Replace path parameters with proper encoding
  Object.keys(params).forEach(key => {
    const paramValue = params[key] === undefined ? '' : String(params[key]);
    const paramRegex = new RegExp(\`\\\\{\${key}\\\\}\`, 'g');
    
    // Log each parameter replacement
    console.log(\`Replacing {\${key}} with \${paramValue}\`);
    
    // Perform replacement
    url = url.replace(paramRegex, encodeURIComponent(paramValue));
  });
  
  // Prepare to join base URL and path - handle leading/trailing slashes
  let finalUrl;
  
  if (url.startsWith('http')) {
    // If the URL is already absolute, use it as is
    finalUrl = url;
  } else {
    // Remove leading slash from path if base URL ends with slash
    if (url.startsWith('/') && BASE_URL.endsWith('/')) {
      url = url.substring(1);
    } 
    // Add leading slash to path if base URL doesn't end with slash and path doesn't start with slash
    else if (!url.startsWith('/') && !BASE_URL.endsWith('/')) {
      url = '/' + url;
    }
    
    finalUrl = \`\${BASE_URL}\${url}\`;
  }
  
  console.log('Final URL:', finalUrl);
  return finalUrl;
}

// Create axios instance with better defaults and debugging
const api = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Debug requests
api.interceptors.request.use(request => {
  console.log('API Request:', {
    method: request.method,
    url: request.url,
    headers: request.headers,
    data: request.data
  });
  return request;
});

// Debug responses
api.interceptors.response.use(
  response => {
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Export handlers object for direct access
export const handlers = {};
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
export async function ${mcpOperationName}Handler(request) {
  console.log('Handling operation: ${mcpOperationName}', request);
  
  try {
    const params = request.params || {};
    // Extract path parameters
    const pathParams = {};
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
    const queryParams = {};
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
    const headers = {
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
    // Log all parameters for debugging
    console.log('Operation ${mcpOperationName}: Path params:', pathParams);
    console.log('Operation ${mcpOperationName}: Query params:', queryParams);
    console.log('Operation ${mcpOperationName}: Headers:', headers);
    
    // Build the URL with detailed logging
    const url = buildUrl("${path}", pathParams);
    
    console.log('Making ${httpMethod} request to URL:', url);
    
    // Make the request to the REST API with improved error handling
    try {
      const response = await axios({
        method: "${method}",
        url: url,
        params: queryParams,
        headers: headers,
        timeout: 30000, // 30 second timeout
        validateStatus: null // Don't throw for non-2xx status codes
      });
      
      console.log('${mcpOperationName} Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: typeof response.data === 'object' ? '[object]' : response.data
      });
      
      // Return the response as text content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      let errorMessage = "An error occurred";
      let status = 500;
      let details = {};
      
      if (error.response) {
        status = error.response.status;
        details = error.response.data || {};
        errorMessage = error.response.data?.message || error.message;
      } else {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
      
      console.error('API request failed:', error.message, error.code);
      
      // Check for timeout specifically
      if (error.code === 'ECONNABORTED') {
        return {
          content: [
            {
              type: "text", 
              text: JSON.stringify({
                error: true,
                status: 408,
                message: "Request timed out after 15 seconds",
                details: { timeoutError: true }
              }, null, 2)
            }
          ]
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: true,
              status,
              message: errorMessage,
              details
            }, null, 2)
          }
        ]
      };
    }
  } catch (error) {
    // Outer try-catch to handle any other errors
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            message: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }
      ]
    };
  }
}
// Add handler to the exported handlers object
handlers["${mcpOperationName}Handler"] = ${mcpOperationName}Handler;
`;
    }
  }
  
  // Append an export at the end to make handlers accessible
  handlersCode += `\n// Export all handlers for direct access\nexport default handlers;\n`;
  
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
