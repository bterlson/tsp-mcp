import { Children } from "@alloy-js/core/jsx-runtime";
import { IntrinsicType } from "@typespec/compiler";
import { call } from "../utils.jsx";

export function intrinsicBuilder(type: IntrinsicType): Children[] {
  switch (type.name) {
    case "null":
      return [call("null")];
    case "never":
      return [call("never")];
    case "unknown":
      return [call("unknown")];
    case "void":
      return [call("void")];
    default:
      return [];
  }
}
