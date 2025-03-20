import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function compileAndStartMcpServer(targetDirectory: string): Promise<void> {
  try {
    // Handle file:// URLs and normalize path
    let normalizedTargetDir = targetDirectory;
    if (normalizedTargetDir.startsWith('file:///')) {
      normalizedTargetDir = normalizedTargetDir.substring(8); // Remove file:///
    }
    
    // Convert potential relative path to absolute path
    normalizedTargetDir = path.resolve(normalizedTargetDir);
    
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
          "@modelcontextprotocol/sdk": "^1.7.0", // Add the MCP SDK
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
          allowJs: true
        },
        include: ["./**/*.ts", "./**/*.js"],
        exclude: ["node_modules", "dist"]
      };
      
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    }
    
    // Install dependencies
    try {
      console.log(`Installing dependencies in ${normalizedTargetDir}...`);
      const installResult = await execAsync("npm install", { cwd: normalizedTargetDir });
      console.log("npm install stdout:", installResult.stdout);
      console.log("npm install stderr:", installResult.stderr);
    } catch (error: any) {
      console.error("Failed to install dependencies:", error.message);
      if (error.stdout) console.error("npm install stdout:", error.stdout);
      if (error.stderr) console.error("npm install stderr:", error.stderr);
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
    
    // Compile TypeScript
    try {
      console.log(`Compiling TypeScript in ${normalizedTargetDir}...`);
      // First check if TypeScript is installed correctly
      const tscVersionResult = await execAsync("npx tsc --version", { cwd: normalizedTargetDir });
      console.log("TypeScript version:", tscVersionResult.stdout);
      
      // Run the build without the --verbose flag
      const buildResult = await execAsync("npm run build", { cwd: normalizedTargetDir });
      console.log("Build stdout:", buildResult.stdout);
      console.log("Build stderr:", buildResult.stderr);
    } catch (error: any) {
      console.error("Failed to compile TypeScript:", error.message);
      if (error.stdout) console.error("Build stdout:", error.stdout);
      if (error.stderr) console.error("Build stderr:", error.stderr);
      throw new Error(`Failed to compile TypeScript: ${error.message}\nstdout: ${error.stdout || ''}\nstderr: ${error.stderr || ''}`);
    }
    
    console.log("MCP server compiled successfully!");
  } catch (error) {
    throw new Error(`Failed to compile MCP server: ${error instanceof Error ? error.message : String(error)}`);
  }

  // This will reset the stdio streams
  process.stdin.pause();
  process.stdin.removeAllListeners();
  setTimeout(() => {
    process.stdin.resume();
  }, 100);
}
