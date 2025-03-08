import { Block, refkey } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { FunctionCallExpression } from "@alloy-js/typescript";

export interface RequestHandlerProps {
  schema: Children;
  children: Children;
}

export function RequestHandler(props: RequestHandlerProps) {
  return (
    <FunctionCallExpression
      target={<>{refkey("server")}.setRequestHandler</>}
      args={[
        props.schema,
        <>
          async (request) {"=>"} <Block>{props.children}</Block>
        </>,
      ]}
    />
  );
}
