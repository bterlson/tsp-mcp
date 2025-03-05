import { beforeEach, describe, it } from "vitest";
import { expect } from "vitest";
import { createTestRunner, TestRunnerWithHost } from "./test-host.js";

describe("typespec-mcp: basic", () => {
  let runner: TestRunnerWithHost;
  
  beforeEach(async () => {
    runner = await createTestRunner(undefined, false);
  });

  it("generates basic model", async () => {
    await runner.compile(`
      @service(#{
        title: "Test API"
      })
      namespace TestAPI;

      model Person {
        id: string;
        name: string;
        age?: int32;
      }
    `);
    
    // Use the absolute path that we know works
    const fullPath = "Z:/test/typespec-mcp/server/src/types.ts";
    const file = runner.fs.get(fullPath);
    
    // Make sure the file exists
    expect(file).not.toBeUndefined();
    
    // Normalize horizontal whitespace only
    const normalizeSpacing = (str: string) => str.replace(/[ \t]+/g, ' ');
    
    // Convert to plain strings for comparison to avoid deep equal issues
    const normalized1 = normalizeSpacing(file!).trimRight();
    const normalized2 = normalizeSpacing(`import { z } from "zod";

export const Person = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().min(-2147483648).max(2147483647).optional()
});`).trimRight();

    // Log for debugging
    console.log("Normalized file:", JSON.stringify(normalized1));
    console.log("Normalized expected:", JSON.stringify(normalized2));
    
    // Use string equality rather than deep equality
    expect(normalized1 === normalized2).toBe(true);
  });
});