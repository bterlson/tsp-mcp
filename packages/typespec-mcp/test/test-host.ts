import {
  BasicTestRunner,
  createTestHost as coreCreateTestHost,
  createTestWrapper,
  TestHost,
} from "@typespec/compiler/testing";
import { TypeSpecMcp } from "../src/testing/index.js";

// Define the return type from createTestWrapper
export type TestRunnerWithHost = BasicTestRunner & {
  host: TestHost;
};

export async function createTestHost() {
  return coreCreateTestHost({
    libraries: [TypeSpecMcp],
  });
}

export async function createTestRunner(emitterOptions?: {}): Promise<TestRunnerWithHost> {
  const host = await createTestHost();
  const importAndUsings = `using TypeSpec.Http;`; // Add Http namespace for @route, @get, etc.
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
    compilerOptions: {
      emit: ["typespec-mcp"],
      options: {
        "typespec-mcp": { ...emitterOptions },
      },
    },
  }) as TestRunnerWithHost; // Cast to our new type
}