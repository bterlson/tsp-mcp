import { Children } from "@alloy-js/core/jsx-runtime";
import { FunctionCallExpression, ObjectExpression } from "@alloy-js/typescript";

export interface FetchCallProps {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  urlString?: string;
  url?: Children;
  body?: Children;
}

export function FetchCall(props: FetchCallProps) {
  const options: any = {
    method: props.method,
  };
  if (props.body) {
    // work around framework bug - no escaping of properties :(
    options.headers = () => (
      <>
        {"{"} "Content-Type": "application/json" {"}"}
      </>
    );
    options.body = () => <>JSON.stringify({props.body})</>;
  }
  return (
    <FunctionCallExpression
      target="fetch"
      args={[
        props.urlString ? (
          <>
            `${"{"}endpoint{"}"}/{props.urlString}`
          </>
        ) : (
          <>endpoint + "/" + {props.url}</>
        ),
        <ObjectExpression jsValue={options} />,
      ]}
    />
  );
}
