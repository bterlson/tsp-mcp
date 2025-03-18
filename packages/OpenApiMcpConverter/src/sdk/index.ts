/**
 * Simple implementation of the Model Context Protocol SDK
 */
export class McpServer {
  private operations: Map<string, any> = new Map();

  constructor() {
    console.log("MCP Server initialized");
  }

  addOperation(operation: {
    name: string;
    description: string;
    parameters: Record<string, any>;
    handler: (params: any) => Promise<any>;
  }): void {
    this.operations.set(operation.name, operation);
    console.log(`Operation '${operation.name}' registered`);
  }

  async start(): Promise<void> {
    console.log("MCP Server started and listening for requests");
    
    // Handle process signals for clean shutdown
    process.on("SIGINT", () => {
      console.log("Shutting down MCP Server...");
      process.exit(0);
    });

    // Keep the process alive
    setInterval(() => {}, 1000);
  }

  // For testing
  async executeOperation(name: string, params: any): Promise<any> {
    const operation = this.operations.get(name);
    if (!operation) {
      throw new Error(`Operation '${name}' not found`);
    }
    
    return await operation.handler(params);
  }
}
