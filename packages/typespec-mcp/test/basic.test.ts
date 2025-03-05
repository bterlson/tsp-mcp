import { beforeEach, describe, it } from "vitest";
import { assertFileContents } from "./utils.js";
import { createTestRunner, TestRunnerWithHost } from "./test-host.js";

describe("typespec-mcp: basic", () => {
  let runner: TestRunnerWithHost;
  
  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("generates basic model", async () => {
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
    `);

    assertFileContents(
      runner,
      "types.ts",
      `import { z } from "zod";

export const PersonModel = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().optional(),
});

export type Person = z.infer<typeof PersonModel>;
`
    );
  });
});