#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server is working correctly.
 */

import { server } from './index.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function runTest() {
  try {
    // Redirect console to stderr
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      process.stderr.write(args.join(' ') + '\n');
    };
    
    process.stderr.write("Starting MCP Test Server\n");
    
    // Use the exported server instance directly
    process.stderr.write("Using exported server instance\n");
    
    const transport = new StdioServerTransport();
    process.stderr.write("Transport created\n");
    
    // Connect to the transport
    process.stderr.write("Connecting server to transport\n");
    await server.connect(transport);
    
    process.stderr.write("Server connected to transport and ready to process requests\n");
    process.stderr.write("Press Ctrl+C to quit\n");
    
    // Keep the process alive with a simple promise that doesn't resolve
    return new Promise<void>((resolve) => {
      process.once('SIGINT', () => {
        process.stderr.write("Received SIGINT signal, shutting down\n");
        resolve(undefined);
      });
    });
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
    throw error; // Never reached, but needed for TypeScript
  }
}

// Run the test
runTest()
  .then(() => {
    process.stderr.write("Server shutdown complete\n");
    process.exit(0);
  })
  .catch(err => {
    process.stderr.write(`Fatal error: ${err}\n`);
    process.exit(1);
  });
