import { beforeEach, describe, it } from "vitest";
import { assertFilePattern } from "./utils.js";
import { createTestRunner, TestRunnerWithHost } from "./test-host.js";

describe("typespec-mcp: configuration files", () => {
  let runner: TestRunnerWithHost;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("generates correct package.json with CLI configuration", async () => {
    await runner.compile(`
      @service({
        title: "Test API"
      })
      namespace TestAPI;
    `);

    // Verify package.json has bin entry for CLI execution
    assertFilePattern(runner, "server/package.json", /"bin":\s*{\s*"mcp-server":/);
    
    // Verify build script includes chmod for executable permissions
    assertFilePattern(runner, "server/package.json", /shx chmod \+x/);
    
    // Verify proper MCP SDK dependency
    assertFilePattern(runner, "server/package.json", /"@modelcontextprotocol\/sdk":/);
    
    // Verify test scripts and devDependencies
    assertFilePattern(runner, "server/package.json", /"test": "vitest run"/);
    assertFilePattern(runner, "server/package.json", /"test:watch": "vitest"/);
    assertFilePattern(runner, "server/package.json", /"test:coverage": "vitest run --coverage"/);
    assertFilePattern(runner, "server/package.json", /"vitest": "\^0.34.0"/);
    assertFilePattern(runner, "server/package.json", /"@vitest\/coverage-v8": "\^0.34.0"/);
  });

  it("generates multi-stage Dockerfile", async () => {
    await runner.compile(`
      @service({
        title: "Test API"
      })
      namespace TestAPI;
    `);

    // Verify Dockerfile has multi-stage build
    assertFilePattern(runner, "server/Dockerfile", /FROM.*AS builder/);
    assertFilePattern(runner, "server/Dockerfile", /FROM.*AS release/);
    
    // Verify Dockerfile has ENTRYPOINT
    assertFilePattern(runner, "server/Dockerfile", /ENTRYPOINT \["node", "dist\/index\.js"\]/);
  });
});