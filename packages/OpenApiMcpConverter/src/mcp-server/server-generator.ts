import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

export async function compileAndStartMcpServer(targetDirectory: string): Promise<void> {
  try {
    console.log(`Starting compilation for target directory: ${targetDirectory}`);
    
    // Handle file:// URLs and normalize path
    let normalizedTargetDir = targetDirectory;
    if (normalizedTargetDir.startsWith('file:///')) {
      normalizedTargetDir = normalizedTargetDir.substring(8); // Remove file:///
    }
    
    // Convert potential relative path to absolute path
    normalizedTargetDir = path.resolve(normalizedTargetDir);
    console.log(`Normalized target directory: ${normalizedTargetDir}`);
    
    // Create sdk directory and file
    const sdkDirPath = path.join(normalizedTargetDir, "src", "sdk");
    if (!fs.existsSync(sdkDirPath)) {
      fs.mkdirSync(sdkDirPath, { recursive: true });
    }

    // Create SDK template directly
    const sdkTemplate = `
/**
 * Simple implementation of the MCP server for testing
 */
export class McpServer {
  operations = new Map();

  constructor() {
    console.log("MCP Server initialized");
  }

  addOperation(operation) {
    this.operations.set(operation.name, operation);
    console.log(\`Operation '\${operation.name}' registered\`);
  }

  async start() {
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
  async testOperation(name, params) {
    const operation = this.operations.get(name);
    if (!operation) {
      throw new Error(\`Operation '\${name}' not found\`);
    }
    
    return await operation.handler(params);
  }
}
`;

    // Write the SDK implementation as JavaScript instead of TypeScript
    fs.writeFileSync(path.join(sdkDirPath, 'index.js'), sdkTemplate);
    console.log(`SDK implementation written to: ${path.join(sdkDirPath, 'index.js')}`);
    
    // Create package.json if it doesn't exist
    const packageJsonPath = path.join(normalizedTargetDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: "openapi-mcp-server",
        version: "1.0.0",
        description: "Automatically generated MCP server from OpenAPI spec",
        main: "dist/index.js",
        type: "module",
        scripts: {
          build: "tsc",
          start: "node dist/index.js"
        },
        dependencies: {
          "axios": "^1.8.3",
          "zod": "^3.22.4",
          "zod-to-json-schema": "^3.22.3"
        },
        devDependencies: {
          "typescript": "^5.0.0",
          "@types/node": "^18.0.0"
        }
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`package.json written to: ${packageJsonPath}`);
    }
    
    // Create tsconfig.json if it doesn't exist
    const tsconfigPath = path.join(normalizedTargetDir, "tsconfig.json");
    if (!fs.existsSync(tsconfigPath)) {
      const tsconfig = {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          outDir: "./dist",
          rootDir: "./",
          strict: false,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          allowJs: true // Allow JS files
        },
        include: ["./**/*.ts", "./**/*.js"],
        exclude: ["node_modules", "dist"]
      };
      
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      console.log(`tsconfig.json written to: ${tsconfigPath}`);
    }
    
    // Install dependencies
    console.log("Installing dependencies...");
    try {
      await execAsync("npm install", { cwd: normalizedTargetDir });
    } catch (error) {
      console.error("Failed to install dependencies:", error);
      throw new Error(`Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Compile TypeScript
    console.log("Compiling TypeScript...");
    try {
      await execAsync("npm run build", { cwd: normalizedTargetDir });
    } catch (error) {
      console.error("Failed to compile TypeScript:", error);
      throw new Error(`Failed to compile TypeScript: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log("MCP server compiled successfully!");
  } catch (error) {
    console.error("Error in compileAndStartMcpServer:", error);
    throw new Error(`Failed to compile MCP server: ${error instanceof Error ? error.message : String(error)}`);
  }
}
