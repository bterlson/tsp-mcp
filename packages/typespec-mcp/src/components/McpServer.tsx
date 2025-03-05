import { Program } from "@typespec/compiler";
import { code, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

// Add JSX namespace reference
import { JSX } from "@alloy-js/core";

// The important things to build in this file are:
// 1. All of the boilerplate code for the MCP server project (package.json, Dockerfile, etc.)
// 2. The actual code for the MCP server itself into index.ts.

export interface McpServerOptions {
  // Using a simpler structure for operations
  operations: Array<{
    operationId: string;
    path: string;
    method: string;
    description?: string;
  }>;
  program: Program;
}

export interface McpServerOutput {
  path: string;
  content: JSX.Element;
}

/**
 * Generates all files for an MCP server project
 * @param options Server generation options
 * @returns Array of file contents with their paths
 */
export function generateMcpServerProject(options: McpServerOptions): McpServerOutput[] {
  const { operations, program } = options;
  
  // Generate the various files for the MCP server project
  return [
    {
      path: "package.json",
      content: <PackageJson />
    },
    {
      path: "tsconfig.json",
      content: <TsConfig />
    },
    {
      path: "Dockerfile",
      content: <Dockerfile />
    },
    {
      path: "README.md",
      content: <ReadmeFile />
    },
    {
      path: "src/index.ts",
      content: <IndexTs operations={operations} program={program} />
    }
  ];
}

function PackageJson() {
  return code`
    {
      "name": "mcp-server",
      "version": "1.0.0",
      "description": "MCP Server implementation generated from TypeSpec",
      "type": "module",
      "main": "dist/index.js",
      "bin": {
        "mcp-server": "dist/index.js"
      },
      "files": [
        "dist"
      ],
      "scripts": {
        "build": "tsc && shx chmod +x dist/index.js",
        "start": "node dist/index.js",
        "dev": "ts-node --esm src/index.ts",
        "watch": "tsc --watch"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "@modelcontextprotocol/sdk": "^1.6.1",
        "@types/node": "^20.10.0",
        "zod": "^3.22.4",
        "zod-to-json-schema": "^3.22.3"
      },
      "devDependencies": {
        "typescript": "^5.3.3",
        "ts-node": "^10.9.1",
        "@types/express": "^4.17.17",
        "@types/cors": "^2.8.13",
        "shx": "^0.3.4"
      }
    }
  `;
}

function TsConfig() {
  return code`
    {
      "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "declaration": true,
        "sourceMap": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist"]
    }
  `;
}

function Dockerfile() {
  return code`
    # Build stage for compiling TypeScript
    FROM node:18-alpine AS builder

    WORKDIR /app

    # Copy package files and install dependencies
    COPY package*.json ./
    # Use cache mounting for faster builds on supported Docker versions
    RUN --mount=type=cache,target=/root/.npm \
        npm install

    # Copy source files and compile TypeScript
    COPY tsconfig.json ./
    COPY src/ ./src/
    RUN npm run build

    # Production stage for runtime
    FROM node:18-alpine AS release

    WORKDIR /app

    # Copy only necessary files from build stage
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/package*.json ./

    # Set NODE_ENV and install only production dependencies
    ENV NODE_ENV=production
    RUN npm ci --omit=dev --ignore-scripts

    # Expose the port the app runs on
    EXPOSE 3000

    # Use ENTRYPOINT for better signal handling
    ENTRYPOINT ["node", "dist/index.js"]
  `;
}

function ReadmeFile() {
  return code`
    # MCP Server

    This is an automatically generated Model Context Protocol server based on your TypeSpec API definition.

    ## Getting Started

    1. Install dependencies:
       \`\`\`
       npm install
       \`\`\`

    2. Build the server:
       \`\`\`
       npm run build
       \`\`\`

    3. Start the server:
       \`\`\`
       npm start
       \`\`\`

    ## Development

    For development with hot reload:
    \`\`\`
    npm run dev
    \`\`\`

    ## Docker

    To build and run with Docker:
    \`\`\`
    docker build -t mcp-server .
    docker run -p 3000:3000 mcp-server
    \`\`\`
  `;
}

interface IndexTsProps {
  operations: McpServerOptions['operations'];
  program: Program;
}

function IndexTs({ operations, program }: IndexTsProps) {
  return code`
    #!/usr/bin/env node
    import { Server } from "@modelcontextprotocol/sdk/server/index.js";
    import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
    import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
    import {
      CallToolRequestSchema,
      ListToolsRequestSchema,
    } from "@modelcontextprotocol/sdk/types.js";
    import { z } from 'zod';
    import { zodToJsonSchema } from 'zod-to-json-schema';
    import express from 'express';

    // Import schemas generated by typespec-mcp
    import * as schemas from './types.js';

    // Constants
    const VERSION = "1.0.0";
    const SERVER_NAME = "typespec-mcp-server";

    /**
     * Creates and configures the MCP server
     */
    function createServer() {
      const server = new Server(
        {
          name: SERVER_NAME,
          version: VERSION,
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Set up MCP request handlers
      setupRequestHandlers(server);
      
      return server;
    }

    /**
     * Sets up MCP request handlers on the server
     */
    function setupRequestHandlers(server) {
      // Handle tool listing
      server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
          tools: [
            ${<ToolDefinitions operations={operations} />}
          ],
        };
      });

      // Handle tool execution
      server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
          if (!request.params.arguments) {
            throw new Error("Arguments are required");
          }

          switch (request.params.name) {
            ${<ToolHandlers operations={operations} />}
            default:
              throw new Error(\`Unknown tool: \${request.params.name}\`);
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(\`Invalid input: \${JSON.stringify(error.errors)}\`);
          }
          throw error;
        }
      });
    }

    /**
     * Configures and starts the Express HTTP server with SSE support
     */
    function startHttpServer(server) {
      const app = express();
      const port = process.env.PORT || 3000;
      app.use(express.json());

      // Track the current SSE transport
      let currentTransport = null;
      
      // Set up SSE endpoint for MCP over HTTP
      app.get('/sse', async (req, res) => {
        console.log('SSE connection established');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Create a new SSE transport
        currentTransport = new SSEServerTransport('/messages', res);
        
        // Connect the server to this transport
        await server.connect(currentTransport);
        
        // Handle client disconnect
        req.on('close', () => {
          currentTransport = null;
          console.log('SSE client disconnected');
        });
      });
      
      // Set up message handling endpoint
      app.post('/messages', async (req, res) => {
        if (!currentTransport) {
          return res.status(400).json({ error: 'No active SSE connection' });
        }
        
        try {
          await currentTransport.handlePostMessage(req, res);
        } catch (error) {
          console.error('Error handling message:', error);
          res.status(500).json({ error: 'Failed to process message' });
        }
      });

      // Health check endpoint
      app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
      });

      // MCP manifest endpoint
      app.get('/.well-known/mcp', (req, res) => {
        res.json({
          manifestVersion: "0.1",
          apis: [
            {
              name: "default",
              description: "Generated MCP API",
              specification: "/mcp/openapi.json"
            }
          ]
        });
      });

      // OpenAPI spec endpoint
      app.get('/mcp/openapi.json', (req, res) => {
        res.json({
          openapi: "3.0.0",
          info: {
            title: "Generated MCP API",
            version: VERSION
          },
          paths: {}
        });
      });

      /* 
      // Traditional REST API endpoints - commented out for demo
      ${<HttpEndpoints operations={operations} />}
      */

      // Start the HTTP server
      app.listen(port, () => {
        console.log(\`HTTP server running on port \${port}\`);
        console.log(\`MCP SSE endpoint available at http://localhost:\${port}/sse\`);
        console.log(\`MCP messages endpoint available at http://localhost:\${port}/messages\`);
      });
    }

    /**
     * Starts the MCP server with stdio transport for CLI usage
     */
    async function startStdioServer(server) {
      try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("MCP Server running on stdio");
      } catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
      }
    }

    /**
     * Main function to initialize and start the server
     */
    async function main() {
      // Create the MCP server
      const server = createServer();
      
      // Start the HTTP server with SSE support
      startHttpServer(server);
      
      // For CLI usage, also start with stdio transport if not in TTY mode
      if (!process.stdin.isTTY) {
        await startStdioServer(server);
      }
    }

    // Run the main function
    main().catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  `;
}

interface ToolDefinitionsProps {
  operations: McpServerOptions['operations'];
}

function ToolDefinitions({ operations }: ToolDefinitionsProps) {
  if (!operations || operations.length === 0) {
    return code`
      {
        name: "example_operation",
        description: "Example operation for demonstration",
        inputSchema: zodToJsonSchema(schemas.ExampleModel)
      }
    `;
  }
  
  return mapJoin(
    operations,
    (op) => {
      const modelName = `${op.operationId}Model`;
      return code`
        {
          name: "${op.operationId}",
          description: "${op.description || `Operation for ${op.path}`}",
          inputSchema: zodToJsonSchema(schemas.${modelName})
        }
      `;
    },
    { joiner: ",\n" }
  );
}

interface ToolHandlersProps {
  operations: McpServerOptions['operations'];
}

function ToolHandlers({ operations }: ToolHandlersProps) {
  if (!operations || operations.length === 0) {
    return code`
      case "example_operation": {
        const args = schemas.ExampleModel.parse(request.params.arguments);
        // Implement operation logic here
        return {
          content: [{ type: "text", text: JSON.stringify({ 
            message: "Example operation executed", 
            args 
          }, null, 2) }]
        };
      }
    `;
  }
  
  return mapJoin(
    operations,
    (op) => {
      const modelName = `${op.operationId}Model`;
      return code`
        case "${op.operationId}": {
          const args = schemas.${modelName}.parse(request.params.arguments);
          // Implement operation logic here
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              message: "${op.operationId} executed", 
              args 
            }, null, 2) }]
          };
        }
      `;
    },
    { joiner: "\n" }
  );
}

interface HttpEndpointsProps {
  operations: McpServerOptions['operations'];
}

function HttpEndpoints({ operations }: HttpEndpointsProps) {
  if (!operations || operations.length === 0) {
    return code`// No HTTP endpoints defined in the TypeSpec model`;
  }
  
  return mapJoin(
    operations,
    (op) => {
      const modelName = `${op.operationId}Model`;
      const method = op.method.toLowerCase();
      
      return code`
        app.${method}('${op.path}', (req, res) => {
          try {
            const args = schemas.${modelName}.parse(req.body);
            // Implement operation logic here
            res.json({ message: "${op.operationId} executed", args });
          } catch (error) {
            if (error instanceof z.ZodError) {
              res.status(400).json({ error: error.errors });
            } else {
              res.status(500).json({ error: error.message });
            }
          }
        });
      `;
    },
    { joiner: "\n\n" }
  );
}