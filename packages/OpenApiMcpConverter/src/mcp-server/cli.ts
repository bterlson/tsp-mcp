#!/usr/bin/env node

import { server } from './index.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * CLI entry point for the OpenAPI to MCP converter
 */
// Create the transport
const transport = new StdioServerTransport();

// Connect the server to the transport
server.connect(transport)
  .catch((err: Error) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });

console.error("MCP Server running on stdio");
