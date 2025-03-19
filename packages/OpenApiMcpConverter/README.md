# OpenAPI to MCP Converter

This tool automatically converts OpenAPI specifications into Model Context Protocol (MCP) servers. It allows you to quickly create MCP servers that act as proxies to REST APIs with minimal setup.

## Overview

The OpenAPI to MCP Converter:

1. Reads an OpenAPI specification
2. Generates TypeScript code for an MCP server
3. Compiles the TypeScript code
4. Provides tools for testing the generated server

## Project Structure

- `src/mcp-server/`: Main server implementation
  - `index.ts`: MCP server implementation with operation handlers
  - `startup.ts`: Entry point for the server
  - `server-generator.ts`: Generates and compiles MCP server code
  - `openapi-parser.ts`: Parses OpenAPI specifications
  - `operation-mapper.ts`: Maps REST endpoints to MCP operations
  - `type-generator.ts`: Generates TypeScript interfaces
  - `handler-generator.ts`: Generates operation handlers
  - `cli.ts`: Command-line interface
  - `test-server.ts`: For testing server functionality

## Building and Running

### Prerequisites

- Node.js 16+
- npm

### Building the Project

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

### Running the Server

```bash
# Start the server
npm start
```

### Development

To restart the server after code changes:

```bash
# Build and restart the server
node scripts/build-and-restart.js
```

### Known Issues

**Important**: Currently, VS Code must be restarted between Cline sessions due to a bug with stdio connections. This issue causes Cline to lose connection to the server after certain operations.

## Using with Cline

### Configuration

Make sure your `cline_mcp_settings.json` contains the server configuration:

```json
{
  "mcpServers": {
    "openApiConverter": {
      "command": "node",
      "args": [
        "c:\\path\\to\\tsp-mcp\\packages\\OpenApiMcpConverter\\dist\\src\\mcp-server\\startup.js"
      ],
      "cwd": "c:\\path\\to\\tsp-mcp\\packages\\OpenApiMcpConverter",
      "disabled": false,
      "autoApprove": [
        "convert_openapi_to_mcp",
        "generate_mcp_server",
        "test_mcp_server"
      ]
    }
  }
}
```

### Example Prompt for Cline

When working with Cline, you can use a prompt like this:

Using the openApiConverter server that you now have access to in the cline_mcp_settings.json file, 
could you convert the following OpenAPI specification to an MCP server?  

URL: [URL to OpenAPI specification]
Target directory: [Directory where the MCP server code will be generated]

You can assume that the openApiConverter server is already built and already running.
Do not try to build it or run it yourself.

If you get a success=false, do not proceed. I will need to evaluate logs to see what's going wrong
and make fixes to the server. However, if you get a "not connected" error, please investigate.
Do not try to rebuild or restart the server, however.
```

