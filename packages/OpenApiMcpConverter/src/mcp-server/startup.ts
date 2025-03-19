import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./index.js";
import * as fs from "fs";
import * as path from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Set up logging to a file
const logFile = path.resolve("./mcp-startup.log");
fs.writeFileSync(logFile, `[${new Date().toISOString()}] Starting MCP server\n`);

// Wrap console.error to write to our log file
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ERROR: ${message}\n`);
  originalConsoleError(...args);
};

// Wrap console.log similarly
const originalConsoleLog = console.log;
console.log = (...args) => {
  const message = args.join(' ');
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] LOG: ${message}\n`);
  originalConsoleLog(...args);
};

// Implement proper resource cleanup
let serverInstance: Server | null = null;
let transportInstance: StdioServerTransport | null = null;

// Graceful shutdown handler
function gracefulShutdown(signal: string): void {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Received ${signal} signal - shutting down gracefully\n`);
  console.error(`Shutting down MCP server (${signal})...`);
  
  // Clean up resources
  if (transportInstance) {
    try {
      // Close stdio transport explicitly
      process.stdin.removeAllListeners();
      process.stdin.pause();
      process.stdout.write(''); // Flush stdout
    } catch (err) {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] Error closing transport: ${err}\n`);
    }
  }
  
  // Exit gracefully
  process.exit(0);
}

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('exit', () => {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Process exiting\n`);
});

// This matches exactly how the demo connects to the transport with added robustness
try {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Creating transport with PID ${process.pid}\n`);
  transportInstance = new StdioServerTransport();
  
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Connecting server to transport\n`);
  await server.connect(transportInstance);
  serverInstance = server;
  
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Server connected to transport\n`);
  console.error(`OpenAPI to MCP Converter running on stdio (PID: ${process.pid})`);
  
  // Add event handlers to capture process events
  process.on('uncaughtException', (err) => {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack || err}\n`);
    console.error("Uncaught exception:", err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason) => {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n`);
    console.error("Unhandled rejection:", reason);
  });
  
} catch (error) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] STARTUP ERROR: ${error instanceof Error ? error.stack : String(error)}\n`);
  console.error("Error starting MCP server:", error);
  process.exit(1);
}
