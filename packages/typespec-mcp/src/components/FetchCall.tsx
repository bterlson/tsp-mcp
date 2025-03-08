import { Children } from "@alloy-js/core/jsx-runtime";
import { FunctionCallExpression, ObjectExpression } from "@alloy-js/typescript";

export interface FetchCallProps {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  urlString?: string;
  url?: Children;
  body?: Children;
}

export function FetchCall(props: FetchCallProps) {
  const options = {
    method: props.method,
    // work around framework bug - no escaping of properties :(
    headers: () => (
      <>
        {"{"} "Content-Type": "application/json" {"}"}
      </>
    ),
    body: undefined as any,
  };
  if (props.body) {
    options.body = props.body;
  }
  return (
    <FunctionCallExpression
      target="fetch"
      args={[
        props.urlString ? (
          <>
            `${"{"}process.env['REST_ENDPOINT']{"}"}/{props.urlString}`
          </>
        ) : (
          <>process.env['REST_ENDPOINT'] + "/" + {props.url}</>
        ),
        <ObjectExpression jsValue={options} />,
      ]}
    />
  );
}
