import { Model, Program } from "@typespec/compiler";
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
  models: Model[]; // Add models to the options interface
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
  const { operations, program, models } = options;
  
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
      content: <IndexTs operations={operations} program={program} models={models} />
    }
  ];
}

// In PackageJson component of McpServer.tsx
function PackageJson() {
  return code`
    {
      "name": "mcp-server",
      "version": "1.0.0",
      "type": "module",
      "scripts": {
        "build": "tsc",
        "start": "node dist/index.js",
        "dev": "tsx watch src/index.ts"
      },
      "dependencies": {
        "@modelcontextprotocol/sdk": "^0.2.0",
        "express": "^4.18.2",
        "crypto": "^1.0.1",
        "zod": "^3.22.4",
        "zod-to-json-schema": "^3.22.3"
      },
      "devDependencies": {
        "@types/express": "^4.17.21",
        "@types/node": "^20.10.5",
        "tsx": "^4.6.2",
        "typescript": "^5.3.3"
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
  models: Model[];
}

function IndexTs({ operations, program, models }: IndexTsProps) {
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
    import crypto from 'crypto';

    // Import schemas generated by typespec-mcp
    import * as schemas from './types.js';

    // Constants
    const VERSION = "1.0.0";
    const SERVER_NAME = "model-context-protocol-server";

    // In-memory stores for all models
    ${mapJoin(models, (model) => {
      const modelName = model.name;
      return code`const ${modelName.toLowerCase()}Store = new Map();`;
    }, { joiner: '\n' })}

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
            ${<ToolDefinitions operations={operations} models={models} />}
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
            ${<ToolHandlers operations={operations} models={models} />}
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

      // Traditional REST API endpoints for each model
      ${<ModelEndpoints models={models} />}

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
     * Creates and starts the MCP server
     * @returns The server instance that was created
     */
    export async function startMcpServer() {
      // Create the MCP server
      const server = createServer();
      
      // Start the HTTP server with SSE support
      startHttpServer(server);
      
      return server;
    }

    /**
     * Main function to initialize and start the server
     */
    async function main() {
      const server = await startMcpServer();
      
      // For CLI usage, also start with stdio transport if not in TTY mode
      if (!process.stdin.isTTY) {
        await startStdioServer(server);
      }
    }

    // Export the main function for use in other modules
    export { main };

    // Run the main function
    main().catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  `;
}

interface ToolDefinitionsProps {
  operations: McpServerOptions['operations'];
  models: Model[];
}

function ToolDefinitions({ operations, models }: ToolDefinitionsProps) {
  // Only check if models exist
  if (!models || models.length === 0) {
    return code`// No models to generate tools for`;
  }
  
  // Generate tools for models (CRUD operations)
  const modelTools = mapJoin(
    models,
    (model) => {
      const modelName = model.name;
      return code`
        {
          name: "get_${modelName.toLowerCase()}s",
          description: "Get all ${modelName} records",
          inputSchema: zodToJsonSchema(z.object({}))
        },
        {
          name: "get_${modelName.toLowerCase()}",
          description: "Get a ${modelName} by ID",
          inputSchema: zodToJsonSchema(z.object({ id: z.string() }))
        },
        {
          name: "create_${modelName.toLowerCase()}",
          description: "Create a new ${modelName}",
          inputSchema: zodToJsonSchema(schemas.${modelName}Model)
        },
        {
          name: "update_${modelName.toLowerCase()}",
          description: "Update a ${modelName} by ID",
          inputSchema: zodToJsonSchema(z.object({ 
            id: z.string(),
            data: schemas.${modelName}Model.partial() 
          }))
        },
        {
          name: "delete_${modelName.toLowerCase()}",
          description: "Delete a ${modelName} by ID",
          inputSchema: zodToJsonSchema(z.object({ id: z.string() }))
        }
      `;
    },
    { joiner: ",\n" }
  );
  
  return modelTools;
}

interface ToolHandlersProps {
  operations: McpServerOptions['operations'];
  models: Model[];
}

function ToolHandlers({ operations, models }: ToolHandlersProps) {
  if (!models || models.length === 0) {
    return code`// No models to generate handlers for`;
  }
  
  // Generate handlers for model tools
  const modelHandlers = mapJoin(
    models,
    (model) => {
      const modelName = model.name;
      return code`
        case "get_${modelName.toLowerCase()}s": {
          // Get items from the in-memory store
          const items = Array.from(${modelName.toLowerCase()}Store.values());
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              message: "List of ${modelName}s", 
              items
            }, null, 2) }]
          };
        }
        case "get_${modelName.toLowerCase()}": {
          const { id } = z.object({ id: z.string() }).parse(request.params.arguments);
          // Get item from the in-memory store
          const item = ${modelName.toLowerCase()}Store.get(id);
          
          if (!item) {
            throw new Error("${modelName} not found");
          }
          
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              message: "Retrieved ${modelName}", 
              id,
              item 
            }, null, 2) }]
          };
        }
        case "create_${modelName.toLowerCase()}": {
          const item = schemas.${modelName}Model.parse(request.params.arguments);
          // Generate a simple UUID for the item
          const id = crypto.randomUUID();
           
          // Store with id
          const storedItem = { id, ...item };
          ${modelName.toLowerCase()}Store.set(id, storedItem);
         
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              message: "Created ${modelName}",
              item: storedItem 
            }, null, 2) }]
          };
        }
        case "update_${modelName.toLowerCase()}": {
          const { id, data } = z.object({ 
            id: z.string(),
            data: schemas.${modelName}Model.partial() 
          }).parse(request.params.arguments);
          // Get existing item
          const existingItem = ${modelName.toLowerCase()}Store.get(id);
         
          if (!existingItem) {
            throw new Error("${modelName} not found");
          }
         
          // Apply updates
          const updatedItem = { ...existingItem, ...data };
          ${modelName.toLowerCase()}Store.set(id, updatedItem);
         
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              message: "Updated ${modelName}",
              id,
              item: updatedItem
            }, null, 2) }]
          };
        }
        case "delete_${modelName.toLowerCase()}": {
          const { id } = z.object({ id: z.string() }).parse(request.params.arguments);
          // Check if item exists
          if (!${modelName.toLowerCase()}Store.has(id)) {
            throw new Error("${modelName} not found");
          }
         
          // Delete the item
          ${modelName.toLowerCase()}Store.delete(id);
         
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              message: "Deleted ${modelName}",
              id 
            }, null, 2) }]
          };
        }
      `;
    },
    { joiner: "\n" }
  );
  
  return modelHandlers;
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

interface ModelEndpointsProps {
  models: Model[];
}

function ModelEndpoints({ models }: ModelEndpointsProps) {
  if (!models || models.length === 0) {
    return code`// No models defined in the TypeSpec model`;
  }
  
  return mapJoin(
    models,
    (model) => {
      // Generate the resource path from model name - convert to lowercase plural
      const modelName = model.name;
      const resourcePath = `/${modelName.toLowerCase()}s`;
      
      return code`
        // ${modelName} endpoints
        
        // GET all ${modelName}s
        app.get('${resourcePath}', (req, res) => {
          const items = Array.from(${modelName.toLowerCase()}Store.values());
          res.json({ 
            message: "List of ${modelName}s", 
            items 
          });
        });
        
        // GET ${modelName} by id
        app.get('${resourcePath}/:id', (req, res) => {
          const id = req.params.id;
          const item = ${modelName.toLowerCase()}Store.get(id);
          
          if (!item) {
            return res.status(404).json({ error: "${modelName} not found" });
          }
          
          res.json({ 
            message: "Retrieved ${modelName}", 
            id: id,
            item  
          });
        });
        
        // POST new ${modelName}
        app.post('${resourcePath}', (req, res) => {
          try {
            const item = schemas.${modelName}Model.parse(req.body);
            // Generate a simple UUID for the item
            const id = crypto.randomUUID();
            
            // Store with id
            const storedItem = { id, ...item };
            ${modelName.toLowerCase()}Store.set(id, storedItem);
            
            res.status(201).json({ 
              message: "Created ${modelName}",
              item: storedItem 
            });
          } catch (error) {
            if (error instanceof z.ZodError) {
              res.status(400).json({ error: error.errors });
            } else {
              res.status(500).json({ error: error.message });
            }
          }
        });
        
        // PATCH ${modelName} by id
        app.patch('${resourcePath}/:id', (req, res) => {
          try {
            const id = req.params.id;
            // Get existing item
            const existingItem = ${modelName.toLowerCase()}Store.get(id);
            
            if (!existingItem) {
              return res.status(404).json({ error: "${modelName} not found" });
            }
            
            // Validate partial updates
            const updates = schemas.${modelName}Model.partial().parse(req.body);
            
            // Apply updates
            const updatedItem = { ...existingItem, ...updates };
            ${modelName.toLowerCase()}Store.set(id, updatedItem);
            
            res.json({ 
              message: "Updated ${modelName}",
              id,
              item: updatedItem
            });
          } catch (error) {
            if (error instanceof z.ZodError) {
              res.status(400).json({ error: error.errors });
            } else {
              res.status(500).json({ error: error.message });
            }
          }
        });
        
        // DELETE ${modelName} by id
        app.delete('${resourcePath}/:id', (req, res) => {
          const id = req.params.id;
          // Check if item exists
          if (!${modelName.toLowerCase()}Store.has(id)) {
            return res.status(404).json({ error: "${modelName} not found" });
          }
          
          // Delete the item
          ${modelName.toLowerCase()}Store.delete(id);
          
          res.json({ 
            message: "Deleted ${modelName}",
            id 
          });
        });
      `;
    },
    { joiner: "\n\n" }
  );
}