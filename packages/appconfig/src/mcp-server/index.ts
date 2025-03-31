import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "../../tsp-output/typespec-mcp/index.js";

// Create Express app
const app = express();

// Get port from environment variable or use 3000 as default
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Track the SSE transport instance
let transport: SSEServerTransport | null = null;

// Set up the SSE endpoint
app.get("/sse", (req, res) => {
  console.log("New SSE connection established");
  transport = new SSEServerTransport("/messages", res);
  server.connect(transport);
});

// Set up the message posting endpoint
app.post("/messages", (req, res) => {
  if (transport) {
    transport.handlePostMessage(req, res);
  } else {
    res.status(503).send("No active SSE connection");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`MCP Server running on http://localhost:${port}`);
  console.log(`- SSE endpoint: http://localhost:${port}/sse`);
  console.log(`- Messages endpoint: http://localhost:${port}/messages`);
});
