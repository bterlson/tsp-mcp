import { Children, refkey, StatementList } from "@alloy-js/core";
import { FunctionDeclaration, InterfaceDeclaration, VarDeclaration } from "@alloy-js/typescript";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { TypeExpression } from "@typespec/emitter-framework/typescript";
import { getKeyProp } from "../utils.js";

export interface TypeHandlerProps {
  type: Model;
}

export function TypeHandler(props: TypeHandlerProps) {
  const keyProp = getKeyProp(props.type)?.type ?? $.builtin.string;
  return (
    <StatementList>
      <VarDeclaration
        export
        let
        name={props.type.name + "HandlerValue"}
        refkey={refkey(props.type, "handler-value")}
        type={<>{refkey(props.type, "handler-interface")} | null</>}
      >
        null
      </VarDeclaration>
      <FunctionDeclaration export name={"set" + props.type.name + "Handler"}>
        <FunctionDeclaration.Parameters>
          handler: {refkey(props.type, "handler-interface")}
        </FunctionDeclaration.Parameters>
        {refkey(props.type, "handler-value")} = handler
      </FunctionDeclaration>
      <InterfaceDeclaration
        name={props.type.name + "Handler"}
        refkey={refkey(props.type, "handler-interface")}
        export
      >
        <StatementList>
          <>
            list(): <HandlerReturnType>{refkey(props.type, "ts-read")}[]</HandlerReturnType>
          </>
          <>
            create(data: {refkey(props.type, "ts-create")}):{" "}
            <HandlerReturnType>{refkey(props.type, "ts-read")}</HandlerReturnType>
          </>
          <>
            read(id: <TypeExpression type={keyProp} />
            ): <HandlerReturnType>{refkey(props.type, "ts-read")}</HandlerReturnType>
          </>
          <>
            update(id: <TypeExpression type={keyProp} />, data: {refkey(props.type, "ts-update")}):{" "}
            <HandlerReturnType>{refkey(props.type, "ts-read")}</HandlerReturnType>
          </>
          <>
            delete(id: <TypeExpression type={keyProp} />
            ): <HandlerReturnType>void</HandlerReturnType>
          </>
        </StatementList>
      </InterfaceDeclaration>
    </StatementList>
  );
}

interface HandlerReturnTypeProps {
  children?: Children;
}
function HandlerReturnType(props: HandlerReturnTypeProps) {
  return (
    <>
      Promise{"<"}
      {refkey("http-envelope")}
      {"<"}
      {props.children}
      {">"}
      {">"}
    </>
  );
}
