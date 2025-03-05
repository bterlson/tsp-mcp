/* Important notes:*/

// Note: the Prettier extension for VS Code is not formatting the React fragments correctly.
// If you turn it on and save your file, it will insert newlines within the fragments, which results in
// incorrect Zod code being emitted.  Please don't use it in this file.
// You can turn off the Prettier extension for this file by adding  "files.exclude": { "**/efv2-zod-sketch/src/emitter.tsx": true } to your .vscode/settings.json file.
// You can also turn off the Prettier extension for all files by adding "editor.formatOnSave": false to your  .vscode/settings.json file.

/**
 * Known remaining TODO items:
 * - (1) Need a way to acquire models in reference-order, so that we can emit models that reference other models.
 *       without getting errors in the emit code.  For example, consider the following models:
 *        model A {
 *          prop1: B[]
 *        }
 *        model B {
 *          prop2: string
 *        }
 *   This is perfectly legal TypeSpec, because TypeSpec is not order-dependent.  However, when we emit the models in Zod
 *   (i.e. TypeScript), we need to emit B before A, because A references B:
 *        export const A = z.object({
 *          prop1: z.array(B) // ERROR!  B is not defined yet!
 *        });
 *        export const B = z.object({
 *          prop2: z.string()
 *        });
 *
 *   The efv2 folks are investigating a fix that will allow access to an ordered list of models.
 * */

/* Key scripts for building and running this emitter
Build from the root of the project:
  pnpm --filter efv2-zod-sketch... build

Build, babel, and debug from packages\efv2-zod-sketch:
  pnpm run build
  npx babel src -d dist/src --extensions '.ts,.tsx'
  pnpm build-todo
*/

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, Enum, Model, navigateType } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { writeOutput } from "@typespec/emitter-framework";
import { ZodEnum } from "./components/ZodEnum.jsx";
import { ZodTypeDeclaration } from "./components/ZodTypeDeclaration.jsx";
import { zod } from "./external-packages/zod.js";
export async function $onEmit(context: EmitContext) {
  // Get all models
  const models = getModels();
  const enums = getEnums();
  const tsNamePolicy = ts.createTSNamePolicy();

  // Emit all enums and models
  writeOutput(
    <ay.Output namePolicy={tsNamePolicy} externals={[zod]}>
      <ts.PackageDirectory name="test-package" version="0.0.1" path=".">
        <ay.SourceDirectory path="src">
          <ts.SourceFile path="models.ts">
            {ay.mapJoin(
              enums,
              (enumInstance) => {
                return <ZodEnum type={enumInstance} />;
              },
              { joiner: "\n\n" }
            )}

            {ay.mapJoin(
              models,
              (model) => {
                return <ZodTypeDeclaration type={model} />;
              },
              { joiner: "\n\n" }
            )}
          </ts.SourceFile>
        </ay.SourceDirectory>
      </ts.PackageDirectory>
    </ay.Output>,
    context.emitterOutputDir,
  );
}

/**
 * Collects all the models defined in the spec
 * @returns A collection of all defined models in the spec
 */
function getModels() {
  // This method is temporary until we have a way to get models in reference order from the efv2 team.
  // Currently, the models are emitted in the order they are found in the spec, which can cause issues.
  // In the interim, make sure to define models in the TypeSpec in reference-order or you may get errors
  // when emitting the models.

  const models = new Set<Model>();

  const globalNs = $.program.getGlobalNamespaceType();

  // There might be models defined in the global namespace. For example https://bit.ly/4fTYkD6
  const globalModels = Array.from(globalNs.models.values());

  // Get all namespaces defined in the spec, excluding TypeSpec namespace.
  const specNamespaces = Array.from(globalNs.namespaces.values()).filter(
    (ns) => !ns.name.startsWith("TypeSpec"),
  );

  for (const ns of specNamespaces) {
    navigateType(
      ns,
      {
        model(model) {
          // Ignore models from TypeSpec namespace, i.e Array or Record
          // We only want models defined in the spec
          if (model.namespace && model.namespace.name === "TypeSpec") {
            return;
          }
          models.add(model);
        },
      },
      { includeTemplateDeclaration: false },
    );
  }

  return [...globalModels, ...models];
}

/**
 * Collects all the enums defined in the spec
 * @returns A collection of all defined enums in the spec
 */
function getEnums() {
  const enums = new Set<Enum>();
  const globalNs = $.program.getGlobalNamespaceType();
  const globalEnums = Array.from(globalNs.enums.values());
  const specNamespaces = Array.from(globalNs.namespaces.values()).filter(
    (ns) => !ns.name.startsWith("TypeSpec"),
  );

  for (const ns of specNamespaces) {
    navigateType(
      ns,
      {
        enum(enumType) {
          enums.add(enumType);
        },
      },
      { includeTemplateDeclaration: false },
    );
  }

  return [...globalEnums, ...enums];
}
