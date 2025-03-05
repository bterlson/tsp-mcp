import { it } from "vitest";
import { createTestRunner } from "./test-host.js";
import { assertFileContents } from "./utils.js";

it("works", async () => {
  const runner = await createTestRunner();
  await runner.compile(`
    model Foo {
      x: string;
      y: {
        z: string;
      }
    }
  `);

  //assertFileContents(runner, "types.ts", "");
  assertFileContents(runner, "app.ts", "");
});
