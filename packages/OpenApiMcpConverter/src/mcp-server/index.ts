import { McpServer } from "@modelcontextprotocol/sdk";
import { fetchOpenApiSpec, parseOpenApiSpec } from "./openapi-parser";
import { generateMcpOperations } from "./operation-mapper";
import { generateTypeScriptInterfaces } from "./type-generator";
import { generateOperationHandlers } from "./handler-generator";
import { compileAndStartMcpServer } from "./server-generator";
import * as fs from "fs";
import * as path from "path";

const server = new McpServer();

// Define operation to convert OpenAPI spec to MCP
server.addOperation({
  name: "convert_openapi_to_mcp",
  description: "Converts an OpenAPI specification to MCP operations",
  parameters: {
    openApiUrl: {
      type: "string",
      description: "URL to the OpenAPI specification JSON"
    },
    targetDirectory: {
      type: "string",
      description: "Directory where the MCP server code will be generated"
    }
  },
  handler: async (params: { openApiUrl: string; targetDirectory: string }) => {
    try {
      // Fetch and parse the OpenAPI spec
      const openApiSpec = await fetchOpenApiSpec(params.openApiUrl);
      const parsedSpec = parseOpenApiSpec(openApiSpec);
      
      // Generate TypeScript interfaces for request/response types
      const typeDefinitions = generateTypeScriptInterfaces(parsedSpec);
      
      // Map REST endpoints to MCP operations
      const mcpOperations = generateMcpOperations(parsedSpec);
      
      // Generate operation handlers
      const operationHandlers = generateOperationHandlers(parsedSpec, params.openApiUrl);
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(params.targetDirectory)) {
        fs.mkdirSync(params.targetDirectory, { recursive: true });
      }
      
      // Write generated files
      fs.writeFileSync(
        path.join(params.targetDirectory, "types.ts"),
        typeDefinitions
      );
      
      fs.writeFileSync(
        path.join(params.targetDirectory, "operations.ts"),
        mcpOperations
      );
      
      fs.writeFileSync(
        path.join(params.targetDirectory, "handlers.ts"),
        operationHandlers
      );
      
      fs.writeFileSync(
        path.join(params.targetDirectory, "index.ts"),
        `
import { McpServer } from "@modelcontextprotocol/sdk";
import { registerOperations } from "./operations";

const server = new McpServer();
registerOperations(server);
server.start();
        `.trim()
      );
      
      // Safely get operation paths
      const operations = [];
      if (parsedSpec.paths) {
        for (const path of Object.keys(parsedSpec.paths)) {
          const pathObj = parsedSpec.paths[path];
          if (pathObj) {
            for (const method of Object.keys(pathObj)) {
              if (method !== 'parameters') {
                operations.push(`${method.toUpperCase()} ${path}`);
              }
            }
          }
        }
      }
      
      return {
        success: true,
        outputDirectory: params.targetDirectory,
        operations
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || String(error)
      };
    }
  }
});

// Define operation to generate and compile the MCP server
server.addOperation({
  name: "generate_mcp_server",
  description: "Compiles and prepares the generated MCP server code",
  parameters: {
    targetDirectory: {
      type: "string",
      description: "Directory where the MCP server code was generated"
    }
  },
  handler: async (params) => {
    try {
      await compileAndStartMcpServer(params.targetDirectory);
      
      return {
        success: true,
        message: "MCP server compiled successfully",
        runCommand: `node ${path.join(params.targetDirectory, "dist", "index.js")}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || String(error)
      };
    }
  }
});

// Define operation to test the generated MCP server
server.addOperation({
  name: "test_mcp_server",
  description: "Tests operations of the generated MCP server",
  parameters: {
    targetDirectory: {
      type: "string",
      description: "Directory where the MCP server code was generated"
    },
    operationName: {
      type: "string",
      description: "Name of the operation to test"
    },
    parameters: {
      type: "object",
      description: "Parameters to pass to the operation"
    }
  },
  handler: async (params) => {
    try {
      // Dynamic import of the generated MCP server
      const serverModule = require(path.join(params.targetDirectory, "dist", "index.js"));
      
      // Test the specified operation
      const result = await serverModule.testOperation(params.operationName, params.parameters);
      
      return {
        success: true,
        operationName: params.operationName,
        result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || String(error)
      };
    }
  }
});

// Start the MCP server
server.start();
