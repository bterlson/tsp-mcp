import { ModelProperty } from "@typespec/compiler";
import { it } from "vitest";
import { ZodType } from "../src/components/ZodType.jsx";
import { createTestRunner, expectRender } from "./utils.jsx";

it("works with literals", async () => {
  const runner = await createTestRunner();
  const { stringProp, numberProp, booleanProp } = (await runner.compile(`
    model Test {
      @test
      stringProp: "hello",

      @test
      numberProp: 123,

      @test
      booleanProp: true,
    }
  `)) as Record<string, ModelProperty>;

  expectRender(<ZodType type={stringProp.type} />, 'z.literal("hello")');
  expectRender(<ZodType type={numberProp.type} />, "z.literal(123)");
  expectRender(<ZodType type={booleanProp.type} />, "z.literal(true)");
});
