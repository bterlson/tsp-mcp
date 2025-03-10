import { Block } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";

export interface SwitchStatementProps {
  test: Children;
  children: Children;
}

export function SwitchStatement(props: SwitchStatementProps) {
  return (
    <>
      switch ({props.test}) <Block>{props.children}</Block>
    </>
  );
}
