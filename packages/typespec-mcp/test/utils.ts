import { BasicTestRunner } from "@typespec/compiler/testing";
import { expect } from "vitest";

export function assertFileContents(runner: BasicTestRunner, path: string, contents: string) {
  const fullPath = "/test/typespec-mcp/" + path;
  const file = runner.fs.get(fullPath);
  if (file === undefined) {
    throw new Error(`File not found: ${fullPath}`);
  }
  expect(file).toEqual(contents);
}

export function assertFileExists(runner: BasicTestRunner, path: string) {
  const fullPath = "/test/typespec-mcp/" + path;
  const file = runner.fs.get(fullPath);
  if (file === undefined) {
    throw new Error(`File not found: ${fullPath}`);
  }
}

export function assertFilePattern(runner: BasicTestRunner, path: string, pattern: RegExp) {
  const fullPath = "/test/typespec-mcp/" + path;
  const file = runner.fs.get(fullPath);
  if (file === undefined) {
    throw new Error(`File not found: ${fullPath}`);
  }
  expect(file).toMatch(pattern);
}