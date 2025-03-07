import { Block, For, Output, refkey, StatementList } from "@alloy-js/core";
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

  writeOutput(
    <Output externals={[zod, hono, zValidator]}>
      <SourceFile path="utils.ts">
        <Declaration
          export
          refkey={refkey("http-envelope")}
          name="HttpEnvelope"
          nameKind="interface"
        >
          interface HttpEnvelope{"<"}T{">"}{" "}
          <Block>
            status: number;
            <hbr />
            body: T | {refkey("http-error")};
          </Block>
        </Declaration>
        <hbr />

        <InterfaceDeclaration export refkey={refkey("http-error")} name="HttpError">
          <StatementList>
            <InterfaceMember name="code">string</InterfaceMember>
            <InterfaceMember name="message">string</InterfaceMember>
          </StatementList>
        </InterfaceDeclaration>
      </SourceFile>
      <SourceFile path="ts-types.ts">
        <For each={models}>{(model) => <TsTypeDeclarations type={model} />}</For>
      </SourceFile>
      <SourceFile path="zod-types.ts">
        <For each={models}>{(model) => <ZodTypeDeclarations type={model} />}</For>
      </SourceFile>
      <SourceFile path="app.ts">
        <VarDeclaration export refkey={HonoApp} name="app">
          new {hono.Hono}()
        </VarDeclaration>
        ;<hbr />
        <For each={models} hardline>
          {(model) => <RestResource type={model} />}
        </For>
      </SourceFile>
      <SourceFile path="handlers.ts">
        <For each={models}>{(model) => <TypeHandler type={model} />}</For>
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
