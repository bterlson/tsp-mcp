import { Output, render } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { SourceFile } from "@alloy-js/typescript";
import {
  createTestHost as coreCreateTestHost,
  createTestWrapper,
} from "@typespec/compiler/testing";
import { expect } from "vitest";
import { zod } from "../src/index.js";

export function expectRender(children: Children, expected: string) {
  const template = (
    <Output externals={[zod]}>
      <SourceFile path="test.ts">{children}</SourceFile>
    </Output>
  );

  const output = render(template);
  expect((output.contents[0].contents as string).split(/\n/).slice(2).join("\n")).toBe(expected);
}

export async function createTestHost() {
  return coreCreateTestHost();
}

export async function createTestRunner(emitterOptions?: {}) {
  const host = await createTestHost();
  const importAndUsings = ``;
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
  });
}
