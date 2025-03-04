import { mapJoin, Output } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { EmitContext, Model, navigateProgram } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { writeOutput } from "@typespec/emitter-framework";
import { zod, ZodModel } from "typespec-zod";

export async function $onEmit(context: EmitContext) {
  const models = getAllModels(context);
  const modelDecls = mapJoin(models, (model) => <ZodModel model={model} />);

  writeOutput(
    <Output externals={[zod]}>
      <SourceFile path="types.ts">
        {modelDecls}
      </SourceFile>
    </Output>,
    context.emitterOutputDir,
  );
}

function getAllModels(context: EmitContext) {
  const models: Model[] = [];
  navigateProgram(
    context.program,
    {
      model(m) {
        // todo: tighten this up with a typekit?
        if (
          !$.model.isExpresion(m) &&
          m.namespace!.name !== "TypeSpec" &&
          m.namespace!.name !== "Reflection"
        ) {
          models.push(m);
        }
      },
    },
    {},
  );

  return models;
}
