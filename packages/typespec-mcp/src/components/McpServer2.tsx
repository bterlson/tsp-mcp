import { refkey, StatementList } from "@alloy-js/core";
import { FunctionCallExpression, ObjectExpression, VarDeclaration } from "@alloy-js/typescript";
import { Model } from "@typespec/compiler";
import { mcp } from "../externals.js";
import { CallToolHandler } from "./CallToolHandler.jsx";
import { ListToolsHandler } from "./ListToolsHandler.jsx";

export interface McpServer2Props {
  models: Model[];
}

export function McpServer2(props: McpServer2Props) {
  const serverInfo = {
    name: "mcp-server",
    version: "1.0.0",
  };

  const serverOptions = {
    capabilities: {
      tools: {},
    },
  };

  return (
    <>
      <StatementList>
        <VarDeclaration export name="server" refkey={refkey("server")}>
          new{" "}
          <FunctionCallExpression
            target={mcp["./server/index.js"].Server}
            args={[
              <ObjectExpression jsValue={serverInfo} />,
              <ObjectExpression jsValue={serverOptions} />,
            ]}
          />
        </VarDeclaration>
        <ListToolsHandler types={props.models} />
        <CallToolHandler types={props.models} />
      </StatementList>
    </>
  );
}
