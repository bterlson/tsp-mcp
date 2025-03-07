import { mapJoin, Output, refkey } from "@alloy-js/core";
import {
  BarrelFile,
  Declaration,
  InterfaceDeclaration,
  InterfaceMember,
  SourceFile,
  VarDeclaration,
} from "@alloy-js/typescript";
import { EmitContext, Model, navigateProgram } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { writeOutput } from "@typespec/emitter-framework";
import { zod } from "typespec-zod";
import { RestResource } from "./components/RestResource.jsx";
import { TsTypeDeclarations } from "./components/TsTypeDeclarations.jsx";
import { TypeHandler } from "./components/TypeHandler.jsx";
import { ZodTypeDeclarations } from "./components/ZodTypeDecarations.jsx";
import { hono, zValidator } from "./externals/hono.js";
import { HonoApp } from "./well-known-symbols.js";

export async function $onEmit(context: EmitContext) {
  const models = getAllModels(context);
  const zodModelDecls = mapJoin(models, (model) => <ZodTypeDeclarations type={model} />);
  const tsModelDecls = mapJoin(models, (model) => <TsTypeDeclarations type={model} />);
  const restEndpoints = mapJoin(models, (model) => <RestResource type={model} />);
  const handlers = mapJoin(models, (model) => <TypeHandler type={model} />);

  writeOutput(
    <Output externals={[zod, hono, zValidator]}>
      <SourceFile path="utils.ts">
        
        <Declaration export refkey={refkey("http-envelope")} name="HttpEnvelope" nameKind="interface">
          interface HttpEnvelope{"<"}T{">"} {"{"}
            status: number,
            body: T | {refkey("http-error")}
          {"}"}
        </Declaration>

        <InterfaceDeclaration export refkey={refkey("http-error")} name="HttpError">
          <InterfaceMember name="code">string</InterfaceMember>
          <InterfaceMember name="message">string</InterfaceMember>
        </InterfaceDeclaration>
      </SourceFile>
      <SourceFile path="ts-types.ts">
        {tsModelDecls}
      </SourceFile>
      <SourceFile path="zod-types.ts">
        {zodModelDecls}
      </SourceFile>
      <SourceFile path="app.ts">
        <VarDeclaration export refkey={HonoApp} name="app">
          new {hono.Hono}()
        </VarDeclaration>
        {restEndpoints}
      </SourceFile>
      <SourceFile path="handlers.ts">
        {handlers}
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
