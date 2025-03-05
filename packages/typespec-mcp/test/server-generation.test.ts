import { beforeEach, describe, it } from "vitest";
import { assertFileExists, assertFilePattern } from "./utils.js";
import { createTestRunner, TestRunnerWithHost } from "./test-host.js";

describe("typespec-mcp: server generation", () => {
  let runner: TestRunnerWithHost;
    
  beforeEach(async () => {
    runner = await createTestRunner(undefined, false);
  });

  it("generates server project files", async () => {
    await runner.compile(`
      @service({
        title: "Test API"
      })
      namespace TestAPI;

      model Person {
        id: string;
        name: string;
        age?: int32;
      }

      @route("/people")
      @get op getPeople(): Person[];

      @route("/people/{id}")
      @get op getPerson(@path id: string): Person;

      @route("/people")
      @post op createPerson(@body person: Person): Person;
    `);

    // Check that server project files were generated
    assertFileExists(runner, "server/package.json");
    assertFileExists(runner, "server/tsconfig.json");
    assertFileExists(runner, "server/src/index.ts");
    assertFileExists(runner, "server/Dockerfile");
    assertFileExists(runner, "server/README.md");
    
    // Verify server/src/types.ts was copied
    assertFileExists(runner, "server/src/types.ts");
    
    // Verify package.json contains expected dependencies
    assertFilePattern(runner, "server/package.json", /"@modelcontextprotocol\/sdk"/);
    
    // Verify index.ts contains operations
    assertFilePattern(runner, "server/src/index.ts", /getPeople/);
    assertFilePattern(runner, "server/src/index.ts", /getPerson/);
    assertFilePattern(runner, "server/src/index.ts", /createPerson/);
    
    // Verify index.ts contains SSE transport
    assertFilePattern(runner, "server/src/index.ts", /SSEServerTransport/);
  });
});