import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "../../tsp-output/typespec-mcp/index.js";

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Server running on stdio");