import { Children } from "@alloy-js/core/jsx-runtime";
import { ObjectExpression } from "@alloy-js/typescript";

export interface JsonToolCallResponseProps {
  data: Children;
}

export function JsonToolCallResponse(props: JsonToolCallResponseProps) {
  const args = {
    content: [{ type: "text", text: () => <>JSON.stringify({props.data}, null, 2)</> }],
  };

  return <ObjectExpression jsValue={args} />;
}
