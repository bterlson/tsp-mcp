import { it } from "vitest";
import { createTestRunner } from "./test-host.js";
import { assertFileContents } from "./utils.js";

it("works", async () => {
  const runner = await createTestRunner();
  await runner.compile(`
    model TodoItem {
      /** The item's unique id */
      @visibility(Lifecycle.Read) @key id: safeint;

      /** The item's title */
      @maxLength(255)
      title: string;

      /** A longer description of the todo item in markdown format */
      description?: string;

      /** The status of the todo item */
      status: "NotStarted" | "InProgress" | "Completed";

      /** When the todo item was created. */
      @visibility(Lifecycle.Read) createdAt: utcDateTime;

      /** When the todo item was last updated */
      @visibility(Lifecycle.Read) updatedAt: utcDateTime;

      /** When the todo item was makred as completed */
      @visibility(Lifecycle.Read) completedAt?: utcDateTime;
    }
  `);

  //assertFileContents(runner, "types.ts", "");
  assertFileContents(runner, "app.ts", "");
});
