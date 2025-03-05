import { beforeEach, describe, it } from "vitest";
import { assertFilePattern } from "./utils.js";
import { createTestRunner, TestRunnerWithHost } from "./test-host.js";

describe("typespec-mcp: operation extraction", () => {
  let runner: TestRunnerWithHost;

  beforeEach(async () => {
    runner = await createTestRunner(undefined, false);
  });

  it("correctly extracts operations with different HTTP methods", async () => {
    await runner.compile(`
      @service({
        title: "Test API"
      })
      namespace TestAPI;

      model Resource {
        id: string;
        name: string;
      }

      @route("/resources")
      @get op getResources(): Resource[];

      @route("/resources/{id}")
      @get op getResource(@path id: string): Resource;

      @route("/resources")
      @post op createResource(@body resource: Resource): Resource;

      @route("/resources/{id}")
      @put op updateResource(@path id: string, @body resource: Resource): Resource;

      @route("/resources/{id}")
      @delete op deleteResource(@path id: string): void;
    `);

    // Verify index.ts contains all operations with correct HTTP methods
    assertFilePattern(runner, "server/src/index.ts", /getResources.*get/i);
    assertFilePattern(runner, "server/src/index.ts", /getResource.*get/i);
    assertFilePattern(runner, "server/src/index.ts", /createResource.*post/i);
    assertFilePattern(runner, "server/src/index.ts", /updateResource.*put/i);
    assertFilePattern(runner, "server/src/index.ts", /deleteResource.*delete/i);
  });
});