import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const TypeSpecTSDataServer: TypeSpecTestLibrary = createTestLibrary({
  name: "typespec-ts-data-server",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
