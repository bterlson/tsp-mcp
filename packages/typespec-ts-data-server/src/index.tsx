import { mapJoin, Output, refkey } from "@alloy-js/core";
import { BarrelFile, SourceFile } from "@alloy-js/typescript";
import { EmitContext, Model, navigateProgram } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { writeOutput } from "@typespec/emitter-framework";
import { zod, ZodTypeDeclaration } from "typespec-zod";
import { hono, zValidator } from "./externals/hono.js";

export async function $onEmit(context: EmitContext) {
  const models = getAllModels(context);
  const modelDecls = mapJoin(models, (
    model,
  ) => <ZodTypeDeclaration type={model} export refkey={refkey(model, "zod-schema")} />);
  writeOutput(
    <Output externals={[zod, hono, zValidator]}>
      <SourceFile path="types.ts">
        {modelDecls}
      </SourceFile>
      <SourceFile path="app.ts">
        const app = new {hono.Hono}();
        app.get("/", {zValidator.zValidator}("json", {refkey(models[0], "zod-schema")}), (c) ={">"} {"{}"})
      </SourceFile>
      <BarrelFile />
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
