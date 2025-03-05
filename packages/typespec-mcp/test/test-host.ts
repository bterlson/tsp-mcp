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

export async function createTestRunner(
  emitterOptions?: {}, 
  includeHttp = true
): Promise<TestRunnerWithHost> {
  const host = await createTestHost();
  
  // Only add HTTP if requested
  if (includeHttp) {
    // Add HTTP library explicitly
    host.addJsFile("node_modules/@typespec/http/dist/index.js", {
      $lib: "@typespec/http"
    });
  }
  
  // Only include using statement if HTTP is requested
  const importAndUsings = includeHttp ? `using TypeSpec.Http;` : ``;
  
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
    compilerOptions: {
      emit: ["typespec-mcp"],
      options: {
        "typespec-mcp": { ...emitterOptions },
      },
      // Add this to ignore deprecation warnings
      warningAsError: false,
    },
  }) as TestRunnerWithHost;
}