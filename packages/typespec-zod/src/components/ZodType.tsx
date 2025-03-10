import { refkey } from "@alloy-js/core";
import { MemberChainExpression } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { typeBuilder } from "../chain-builders/type.js";
import { zod } from "../external-packages/zod.js";
import { refkeySym, shouldReference } from "../utils.js";

export interface ZodTypeProps {
  type: Type;
  nested?: boolean;
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
export function ZodType(props: ZodTypeProps) {
  if (props.nested && shouldReference(props.type)) {
    return refkey(props.type, refkeySym);
  }

  return (
    <MemberChainExpression>
      <>{zod.z}</>
      {typeBuilder(props.type)}
    </MemberChainExpression>
  );
}
