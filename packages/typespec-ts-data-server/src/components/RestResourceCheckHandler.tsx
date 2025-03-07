import { Block, refkey } from "@alloy-js/core";
import { Type } from "@typespec/compiler";

interface RestResourceCheckHandlerProps {
  type: Type;
}
export function RestResourceCheckHandler(props: RestResourceCheckHandlerProps) {
  return (
    <>
      if ({refkey(props.type, "handler-value")} === null){" "}
      <Block>return c.text("Not Found", 404);</Block>
    </>
  );
}
