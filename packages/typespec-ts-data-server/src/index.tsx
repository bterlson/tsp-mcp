import { mapJoin, Output } from "@alloy-js/core";
import { BarrelFile, SourceFile, VarDeclaration } from "@alloy-js/typescript";
import { EmitContext, Model, navigateProgram } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { writeOutput } from "@typespec/emitter-framework";
import { zod } from "typespec-zod";
import { RestResource } from "./components/RestResource.jsx";
import { ZodTypeDeclarations } from "./components/ZodTypeDecarations.jsx";
import { hono, zValidator } from "./externals/hono.js";
import { HonoApp } from "./well-known-symbols.js";

export async function $onEmit(context: EmitContext) {
  const models = getAllModels(context);
  const modelDecls = mapJoin(models, (model) => <ZodTypeDeclarations type={model} />);

  const restEndpoints = mapJoin(models, (model) => <RestResource type={model} />);
  writeOutput(
    <Output externals={[zod, hono, zValidator]}>
      <SourceFile path="types.ts">
        {modelDecls}
      </SourceFile>
      <SourceFile path="app.ts">
        <VarDeclaration export refkey={HonoApp} name="app">
          new {hono.Hono}()
        </VarDeclaration>
        {restEndpoints}
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
