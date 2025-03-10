import { Indent } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { ValueExpression } from "@alloy-js/typescript";
import { BlockScope } from "./BlockScope.jsx";

export interface CaseClauseProps {
  jsCase?: unknown;
  case?: Children;
  block?: boolean;
  children: Children;
}

export function CaseClause(props: CaseClauseProps) {
  const Wrapper = props.block ? BlockScope : Indent;
  return (
    <>
      case {props.jsCase ? <ValueExpression jsValue={props.jsCase} /> : props.case}
      {": "}
      <Wrapper>{props.children}</Wrapper>
    </>
  );
}
