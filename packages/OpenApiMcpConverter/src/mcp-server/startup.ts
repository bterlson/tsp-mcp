import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./index.js";

// This matches exactly how the demo connects to the transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("OpenAPI to MCP Converter running on stdio");
