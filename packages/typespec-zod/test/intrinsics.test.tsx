import { ModelProperty } from "@typespec/compiler";
import { it } from "vitest";
import { ZodType } from "../src/components/ZodType.jsx";
import { createTestRunner, expectRender } from "./utils.jsx";

it("works with intrinsics", async () => {
  const runner = await createTestRunner();
  const { nullProp, neverProp, unknownProp, voidProp } = (await runner.compile(`
    model Test {
      @test
      nullProp: null,

      @test
      neverProp: never,

      @test
      unknownProp: unknown,

      @test
      voidProp: void,
    }
  `)) as Record<string, ModelProperty>;

  expectRender(<ZodType type={nullProp.type} />, "z.null()");
  expectRender(<ZodType type={neverProp.type} />, "z.never()");
  expectRender(<ZodType type={unknownProp.type} />, "z.unknown()");
  expectRender(<ZodType type={voidProp.type} />, "z.void()");
});
