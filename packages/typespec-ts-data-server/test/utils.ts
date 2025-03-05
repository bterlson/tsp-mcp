import { BasicTestRunner } from "@typespec/compiler/testing";
import { expect } from "vitest";
export function assertFileContents(runner: BasicTestRunner, path: string, contents: string) {
  const fullPath = "/test/typespec-ts-data-server/" + path;
  const file = runner.fs.get(fullPath);
  if (file === undefined) {
    throw new Error(`File not found: ${fullPath}`);
  }
  expect(file).toEqual(contents);
}
