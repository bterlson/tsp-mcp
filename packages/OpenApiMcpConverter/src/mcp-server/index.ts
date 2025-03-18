import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { fetchOpenApiSpec, parseOpenApiSpec } from "./openapi-parser.js";
import { generateMcpOperations } from "./operation-mapper.js";
import { generateTypeScriptInterfaces } from "./type-generator.js";
import { generateOperationHandlers } from "./handler-generator.js";
import { compileAndStartMcpServer } from "./server-generator.js";
import * as fs from "fs";
import * as path from "path";

// Define Zod schemas for our operations
const ConvertOpenApiToMcpSchema = z.object({
  openApiUrl: z.string().describe("URL to the OpenAPI specification JSON"),
  targetDirectory: z.string().describe("Directory where the MCP server code will be generated")
});

const GenerateMcpServerSchema = z.object({
  targetDirectory: z.string().describe("Directory where the MCP server code was generated")
});

const TestMcpServerSchema = z.object({
  targetDirectory: z.string().describe("Directory where the MCP server code was generated"),
  operationName: z.string().describe("Name of the operation to test"),
  parameters: z.record(z.any()).describe("Parameters to pass to the operation")
});

// Create and export the server instance directly - this is exactly how the demo does it
export const server = new Server(
  {
    name: "openapi-mcp-converter",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools for listing
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
    return {
      tools: [
        {
          name: "convert_openapi_to_mcp",
          description: "Converts an OpenAPI specification to MCP operations",
          inputSchema: zodToJsonSchema(ConvertOpenApiToMcpSchema),
        },
        {
          name: "generate_mcp_server",
          description: "Compiles and prepares the generated MCP server code",
          inputSchema: zodToJsonSchema(GenerateMcpServerSchema),
        },
        {
          name: "test_mcp_server",
          description: "Tests operations of the generated MCP server",
          inputSchema: zodToJsonSchema(TestMcpServerSchema),
        }
      ]
    };
  }
);

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
    switch (request.params.name) {
      case "convert_openapi_to_mcp": {
        try {
          const params = ConvertOpenApiToMcpSchema.parse(request.params.arguments);
          
          // Normalize the target directory path to handle file:/// URLs
          let normalizedTargetDir = params.targetDirectory;
          if (normalizedTargetDir.startsWith('file:///')) {
            normalizedTargetDir = normalizedTargetDir.substring(8); // Remove file:///
          }
          
          // Convert to absolute path
          normalizedTargetDir = path.resolve(normalizedTargetDir);
          
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
          if (!fs.existsSync(normalizedTargetDir)) {
            fs.mkdirSync(normalizedTargetDir, { recursive: true });
          }
          
          // Write generated files
          fs.writeFileSync(
            path.join(normalizedTargetDir, "types.ts"),
            typeDefinitions
          );
          
          fs.writeFileSync(
            path.join(normalizedTargetDir, "operations.ts"),
            mcpOperations
          );
          
          fs.writeFileSync(
            path.join(normalizedTargetDir, "handlers.ts"),
            operationHandlers
          );
          
          fs.writeFileSync(
            path.join(normalizedTargetDir, "index.ts"),
            `
import { McpServer } from "./src/sdk/index.js";
import { registerOperations } from "./operations.js";

const server = new McpServer();
registerOperations(server);
server.start();

// Export a function to test operations programmatically
export async function testOperation(name, params) {
  return server.testOperation(name, params);
}
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
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  outputDirectory: normalizedTargetDir, // Return the normalized path
                  operations
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: errorMessage
                }, null, 2)
              }
            ]
          };
        }
      }
      
      case "generate_mcp_server": {
        try {
          const params = GenerateMcpServerSchema.parse(request.params.arguments);
          await compileAndStartMcpServer(params.targetDirectory);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "MCP server compiled successfully",
                  runCommand: `node ${path.join(params.targetDirectory, "dist", "index.js")}`
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: errorMessage
                }, null, 2)
              }
            ]
          };
        }
      }
      
      case "test_mcp_server": {
        try {
          const params = TestMcpServerSchema.parse(request.params.arguments);
          
          // Normalize the target directory path
          let normalizedTargetDir = params.targetDirectory;
          if (normalizedTargetDir.startsWith('file:///')) {
            normalizedTargetDir = normalizedTargetDir.substring(8); // Remove file:///
          }
          
          // Convert to absolute path
          const targetPath = path.resolve(normalizedTargetDir);
          const modulePath = path.join(targetPath, "dist", "index.js");
          
          // Check if the module exists
          if (!fs.existsSync(modulePath)) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Module not found: ${modulePath}. Make sure you have run generate_mcp_server first.`
                  }, null, 2)
                }
              ]
            };
          }
          
          // Convert to file:// URL for import()
          const moduleUrl = `file://${modulePath.replace(/\\/g, '/')}`;
          
          // Dynamic import of the generated MCP server
          const serverModule = await import(moduleUrl);
          
          // Test the specified operation
          const result = await serverModule.testOperation(params.operationName, params.parameters);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  operationName: params.operationName,
                  result
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: errorMessage
                }, null, 2)
              }
            ]
          };
        }
      }
      
      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Unknown tool: ${request.params.name}`
              }, null, 2)
            }
          ]
        };
    }
  }
);
