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
    console.error(`Received tool call request: ${request.params.name}`);
    
    switch (request.params.name) {
      case "convert_openapi_to_mcp": {
        console.error(`Processing convert_openapi_to_mcp with arguments: ${JSON.stringify(request.params.arguments)}`);
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
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerOperations } from "./operations.js";
import * as handlers from "./handlers.js";

// Create and export the server instance
export const server = new Server(
  {
    name: "openapi-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all operations with the server
registerOperations(server);

// Export handlers for direct access if needed
export { handlers };

// When this file is executed directly (like "node dist/index.js"), run the server
if (import.meta.url.endsWith(process.argv[1].replace(/\\\\/g, '/'))) {
  // Create transport
  const transport = new StdioServerTransport();
  console.log("Created stdio transport");
  
  // Connect server to transport - use the same pattern as our own server
  server.connect(transport)
    .then(() => {
      console.log("Server connected to transport");
      console.error("MCP Server running on stdio");
    })
    .catch(error => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
    
  // Keep the process alive
  setInterval(() => {}, 1000);
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
        console.error(`Processing generate_mcp_server with arguments: ${JSON.stringify(request.params.arguments)}`);
        try {
          const params = GenerateMcpServerSchema.parse(request.params.arguments);
          
          // Capture extensive diagnostic information before any processing
          const diagnostics = {
            cwd: process.cwd(),
            targetDir: params.targetDirectory,
            resolvedPath: path.resolve(params.targetDirectory),
            env: process.env.NODE_ENV || 'not set',
            platform: process.platform,
            nodeVersion: process.version,
            moduleType: 'ES Modules',
            timestampUTC: new Date().toISOString(),
            requestParams: JSON.stringify(params)
          };
          
          try {
            await compileAndStartMcpServer(params.targetDirectory);
            
            // Generate usage instructions file with examples
            const usageInstructions = generateUsageInstructions(params.targetDirectory);
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    message: "MCP server compiled successfully",
                    runCommand: `node ${path.join(params.targetDirectory, "dist", "index.js")}`,
                    instructions: "A usage-instructions.md file has been created in your target directory with examples of how to use your server",
                    diagnostics
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Return detailed error with extensive diagnostics
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: errorMessage,
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    errorStack: error instanceof Error ? error.stack : 'No stack trace available',
                    diagnostics
                  }, null, 2)
                }
              ]
            };
          }
        } catch (error) {
          // Error in parsing arguments
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: errorMessage,
                  context: "Error occurred while parsing arguments",
                  parsingError: true,
                  rawArgs: request.params.arguments
                }, null, 2)
              }
            ]
          };
        }
      }
      
      case "test_mcp_server": {
        console.error(`Processing test_mcp_server with arguments: ${JSON.stringify(request.params.arguments)}`);
        try {
          const params = TestMcpServerSchema.parse(request.params.arguments);
          
          // Normalize the target directory path
          let normalizedTargetDir = params.targetDirectory;
          if (normalizedTargetDir.startsWith('file:///')) {
            normalizedTargetDir = normalizedTargetDir.substring(8); // Remove file:///
          }
          
          // Convert to absolute path
          const targetPath = path.resolve(normalizedTargetDir);
          const distPath = path.join(targetPath, "dist");
          const handlersPath = path.join(distPath, "handlers.js");
          
          // Check if the compiled handlers exist
          if (!fs.existsSync(handlersPath)) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Handlers module not found: ${handlersPath}. Make sure you have run generate_mcp_server first.`
                  }, null, 2)
                }
              ]
            };
          }
          
          // Convert operation name if it's in "METHOD /path" format
          let operationName = params.operationName;
          let handlerName;
          
          if (operationName.includes(' ')) {
            // Split "GET /api/v1/provinces" into method and path
            const [method, path] = operationName.split(' ', 2);
            // Convert to camelCase operation name
            operationName = method.toLowerCase() + 
              path.replace(/\/{([^}]+)}/g, 'By$1')
                 .replace(/^\//, '')
                 .split('/')
                 .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
                 .join('');
          }
          
          handlerName = `${operationName}Handler`;
          
          console.error(`Will try to execute handler: ${handlerName}`);
          
          try {
            // Import the handlers module directly without server initialization
            const handlersUrl = `file://${handlersPath.replace(/\\/g, '/')}`;
            const handlersModule = await import(handlersUrl);
            
            // If there's a default export with all handlers, use that
            const handlers = handlersModule.default || handlersModule;
            
            // Look for the handler function
            const handler = handlers[handlerName] || handlersModule[handlerName];
            
            if (!handler || typeof handler !== 'function') {
              const availableHandlers = Object.keys(handlers)
                .filter(key => typeof handlers[key] === 'function')
                .join(', ');
                
              throw new Error(`Handler '${handlerName}' not found. Available handlers: ${availableHandlers}`);
            }
            
            console.error(`Executing handler ${handlerName} with params:`, params.parameters);
            
            // Call the handler directly with a properly formatted request object
            const result = await handler({ 
              params: params.parameters,
              // Add any other context needed by the handler
              context: { testMode: true }
            });
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    operationName: operationName,
                    originalOperationName: params.operationName,
                    result
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            console.error(`Error executing handler: ${error instanceof Error ? error.stack : String(error)}`);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: errorMessage,
                    operationName: operationName,
                    handlerName: handlerName
                  }, null, 2)
                }
              ]
            };
          }
        } catch (error) {
          console.error(`Error processing test_mcp_server: ${error instanceof Error ? error.stack : String(error)}`);
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
      
      default: {
        console.error(`Unknown tool requested: ${request.params.name}`);
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
  }
);

// Helper function to generate usage instructions
function generateUsageInstructions(targetDirectory: string): void {
  try {
    const instructions = `# Using Your Generated MCP Server

## Starting the Server

To start your MCP server:

\`\`\`bash
cd ${targetDirectory}
node dist/index.js
\`\`\`

This will start the MCP server on the standard input/output streams.

## Configuration with Cline

To configure Cline to use your new MCP server, add the following to your \`cline_mcp_settings.json\` file:

\`\`\`json
{
  "mcpServers": {
    "myGeneratedServer": {
      "command": "node",
      "args": [
        "${path.join(targetDirectory, "dist/index.js").replace(/\\/g, '\\\\')}"
      ],
      "cwd": "${targetDirectory.replace(/\\/g, '\\\\')}",
      "disabled": false,
      "autoApprove": [],
    }
  }
}
\`\`\`

## Example Prompts for Cline

You can use prompts like this with Cline:

Using the myGeneratedServer MCP server, could you help me with the following operation?
I'd like to [describe what you want to do with one of the operations]

## Available Operations

The server has these operations available based on the OpenAPI specification:
[These will be displayed in the server output when it starts]

## Testing

You can test operations directly with curl or any API client by making HTTP requests to the endpoint.
`;
    fs.writeFileSync(path.join(targetDirectory, "usage-instructions.md"), instructions);
  } catch (error) {
    console.error("Failed to write usage instructions:", error);
  }
}
