import { code, List, refkey } from "@alloy-js/core";
import { FunctionCallExpression } from "@alloy-js/typescript";
import { Model, Type } from "@typespec/compiler";
import { keyName, resourceName, toolNameForType, debugLog, isErrorModel, sanitizePropertyName } from "../utils.jsx";
import { FetchCall } from "./FetchCall.jsx";
import { JsonToolCallResponse } from "./JsonToolCallResponse.jsx";
import { CaseClause } from "./move-to-alloy/CaseClause.jsx";

export type Actions = "list" | "get" | "create" | "update" | "delete";

export interface ToolHandlerProps {
  type: Type;
  action: Actions;
}

export function ToolHandler(props: ToolHandlerProps) {
  try {
    // Skip error models entirely
    if (props.type && isErrorModel(props.type as Model)) {
      return null;
    }
    
    return (
      <CaseClause jsCase={toolNameForType(props.type, props.action)} block>
        <List hardline>
          <ArgMarshalling {...props} />
          <MakeCall {...props} />
          <>return {<JsonToolCallResponse data={"data"} />};</>
        </List>
      </CaseClause>
    );
  } catch (error) {
    debugLog(`Error in ToolHandler: ${(error as Error).message}`);
    return null;
  }
}

export interface ArgMarshallingProps {
  type: Type;
  action: Actions;
}

export function ArgMarshalling(props: ArgMarshallingProps) {
  const hasId = props.action !== "list" && props.action !== "create";
  const hasBody = props.action === "create" || props.action === "update";

  if (!hasId && !hasBody) {
    return null;
  }

  let bindingPattern;
  if (hasId && hasBody) {
    bindingPattern = `{ id, ...args }`;
  } else if (hasId) {
    bindingPattern = `{ id }`;
  } else {
    bindingPattern = `args`;
  }

  return code`const ${bindingPattern} = ${(
    <FunctionCallExpression
      target={<>{refkey(props.type, "zod-schema-" + props.action)}.parse</>}
      args={["request.params.arguments"]}
    />
  )}`;
}

export interface FetchCallProps {
  type: Type;
  action: Actions;
}

export function MakeCall(props: FetchCallProps) {
  const hasId = props.action !== "list" && props.action !== "create";
  const hasBody = props.action === "create" || props.action === "update";
  const method =
    props.action === "list" || props.action === "get"
      ? "GET"
      : props.action === "create"
        ? "POST"
        : props.action === "update"
          ? "PATCH"
          : "DELETE";

  // Sanitize the key name for the URL path
  const sanitizedKeyName = sanitizePropertyName(keyName(props.type));
  const url = hasId
    ? `"${resourceName(props.type)}/" + ${sanitizedKeyName}`
    : `"${resourceName(props.type)}"`;

  return code`
    const response = await ${(<FetchCall url={url} method={method} body={hasBody && "args"} />)};
    if (!response.ok) {
      // todo: better diagnostics
      throw new Error("HTTP Error: " + response.status);
    };
    const data = await response.json();
  `;
}
