import {
  createTestHost as coreCreateTestHost,
  createTestWrapper,
} from "@typespec/compiler/testing";
import { TypeSpecTSDataServer } from "../src/testing/index.js";

export async function createTestHost() {
  return coreCreateTestHost({
    libraries: [TypeSpecTSDataServer],
  });
}

export async function createTestRunner(emitterOptions?: {}) {
  const host = await createTestHost();
  const importAndUsings = ``;
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
    compilerOptions: {
      emit: ["typespec-ts-data-server"],
      options: {
        "typespec-ts-data-server": { ...emitterOptions },
      },
    },
  });
}
