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

## Workflow

This tool provides three main operations that should be used in sequence:

1. **convert_openapi_to_mcp**: 
   - This first step converts an OpenAPI specification to MCP server code
   - It generates the TypeScript files needed for the MCP server
   - Example Cline prompt provided below

2. **generate_mcp_server**:
   - This second step compiles the generated TypeScript code
   - It installs dependencies and prepares the server for running
   - It generates usage instructions for the resulting server

3. **test_mcp_server**:
   - **Important: This is only an emulation for testing**
   - This does NOT connect to a running instance of the generated server
   - It only imports the handlers and executes them directly for testing purposes
   - For real usage, you should start the generated server using the command provided

4. **Manual Step: Start the generated server**
   - After generation and compilation, you need to manually start the server
   - Use the command provided in the response from step 2
   - Configure your MCP clients (like Cline) to connect to this new server

### Example Prompt for Cline

When working with Cline, you can use a prompt like this for the first step:

