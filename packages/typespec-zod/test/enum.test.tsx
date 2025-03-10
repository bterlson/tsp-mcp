import { Enum } from "@typespec/compiler";
import { it } from "vitest";
import { ZodType } from "../src/index.js";
import { createTestRunner, expectRender } from "./utils.jsx";

it("works with no values", async () => {
  const runner = await createTestRunner();
  const { Test } = (await runner.compile(`
    @test enum Test {
      A, B
    }
  `)) as Record<string, Enum>;

  expectRender(<ZodType type={Test} />, `z.enum(["A", "B"])`);
});

it("works with string values", async () => {
  const runner = await createTestRunner();
  const { Test } = (await runner.compile(`
    @test enum Test {
      A: "a", B: "b"
    }
  `)) as Record<string, Enum>;

  expectRender(<ZodType type={Test} />, `z.enum(["a", "b"])`);
});

it("works with number values", async () => {
  const runner = await createTestRunner();
  const { Test } = (await runner.compile(`
    @test enum Test {
      A: 1, B: 2
    }
  `)) as Record<string, Enum>;

  expectRender(<ZodType type={Test} />, `z.enum([1, 2])`);
});
