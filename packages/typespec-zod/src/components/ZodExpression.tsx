import { Children } from "@alloy-js/core/jsx-runtime";
import { MemberChainExpression } from "@alloy-js/typescript";
import { zod } from "../external-packages/zod.js";

export interface ZodExpressionSimpleProps {
  /**
   * The target of the expression.
   */
  target: string;
}
export interface ZodExpression {
  /**
   * The subsequent call chain expression children to construct this zod type.
   */
  children?: Children;
}

export function ZodExpression(props: ZodExpression) {
  return (
    <MemberChainExpression>
      <>{zod.z}</>
      {props.children}
    </MemberChainExpression>
  );
}
