import { code, For, List } from "@alloy-js/core";
import { Type } from "@typespec/compiler";
import { mcp } from "../externals.js";
import { SwitchStatement } from "./move-to-alloy/SwitchStatement.jsx";
import { RequestHandler } from "./RequestHandler.jsx";
import { ToolHandler } from "./ToolHandler.jsx";

export interface CallToolHandlersProps {
  types: Type[];
}

export function CallToolHandlers(props: CallToolHandlersProps) {
  return (
    <RequestHandler schema={mcp["./types.js"].CallToolRequestSchema}>
      <SwitchStatement test="request.params.name">
        <For each={props.types}>
          {(type) => (
            <List hardline>
              <ToolHandler type={type} action="list" />
              <ToolHandler type={type} action="get" />
              <ToolHandler type={type} action="create" />
              <ToolHandler type={type} action="update" />
              <ToolHandler type={type} action="delete" />
            </List>
          )}
        </For>
      </SwitchStatement>
      <hbr />
      <hbr />
      {code`
        return {
          content: [
            {
              type: "text",
              text: "Tool not found",
            }
          ],
        };
      `}
    </RequestHandler>
  );
}
