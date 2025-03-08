import { createPackage } from "@alloy-js/typescript";

export const mcp = createPackage({
  name: "@modelcontextprotocol/sdk",
  version: "^1.6.1",
  descriptor: {
    "./server/index.js": {
      named: ["Server"],
    },
    "./server/stdio.js": {
      named: ["StdioServerTransport"],
    },
    "./types.js": {
      named: ["CallToolRequestSchema", "ListToolsRequestSchema"],
    },
  },
});

export const zodToJsonSchema = createPackage({
  name: "zod-to-json-schema",
  version: "^3.24.3",
  descriptor: {
    ".": {
      named: ["zodToJsonSchema"],
    },
  },
});
