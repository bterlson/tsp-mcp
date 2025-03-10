import { it } from "vitest";
import { createCycleset } from "../src/utils.js";
import { createTestRunner } from "./utils.jsx";

it("creates a cycle set", async () => {
  const runner = await createTestRunner();
  const { Test, Test2, Test3 } = await runner.compile(`
    @test model Test {
      prop: Test2;
      prop2: string;
    }

    @test model Test2 {
      prop: Test3;
      prop3: numeric;
    }

    @test model Test3 {
      prop: Test2
    }
  `);

  const cycleSet = createCycleset([Test, Test2, Test3]);
  console.log(cycleSet);
});
