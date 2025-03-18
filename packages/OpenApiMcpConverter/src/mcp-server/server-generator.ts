import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function compileAndStartMcpServer(targetDirectory: string): Promise<void> {
  // Create package.json if it doesn't exist
  const packageJsonPath = path.join(targetDirectory, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    const packageJson = {
      name: "openapi-mcp-server",
      version: "1.0.0",
      description: "Automatically generated MCP server from OpenAPI spec",
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js"
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.0.0",
        "axios": "^0.21.1"
      },
      devDependencies: {
        "typescript": "^4.5.4",
        "@types/node": "^16.11.12"
      }
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  
  // Create tsconfig.json if it doesn't exist
  const tsconfigPath = path.join(targetDirectory, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) {
    const tsconfig = {
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        outDir: "./dist",
        rootDir: "./",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ["./**/*.ts"],
      exclude: ["node_modules", "dist"]
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  }
  
  try {
    // Install dependencies
    console.log("Installing dependencies...");
    await execAsync("npm install", { cwd: targetDirectory });
    
    // Compile TypeScript
    console.log("Compiling TypeScript...");
    await execAsync("npm run build", { cwd: targetDirectory });
    
    console.log("MCP server compiled successfully!");
  } catch (error: any) {
    throw new Error(`Failed to compile MCP server: ${error?.message || String(error)}`);
  }
}
