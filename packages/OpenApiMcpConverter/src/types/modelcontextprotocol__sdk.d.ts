declare module '@modelcontextprotocol/sdk' {
  export class McpServer {
    constructor();
    addOperation(operation: {
      name: string;
      description: string;
      parameters: Record<string, any>;
      handler: (params: any) => Promise<any>;
    }): void;
    start(): void;
  }
}
