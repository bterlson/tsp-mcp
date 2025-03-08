import { ObjectExpression } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { mcp } from "../externals.js";
import { typeToToolDescriptors } from "../utils.js";
import { RequestHandler } from "./RequestHandler.jsx";

export interface ListToolsHandlerProps {
  types: Type[];
}

export function ListToolsHandler(props: ListToolsHandlerProps) {
  const toolList = {
    tools: props.types
      .map((type) => {
        return typeToToolDescriptors(type);
      })
      .flat(),
  };

  return (
    <RequestHandler schema={mcp["./types.js"].ListToolsRequestSchema}>
      return <ObjectExpression jsValue={toolList} />;
    </RequestHandler>
  );
}
