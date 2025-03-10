import { LiteralType } from "@typespec/compiler";
import { call } from "../utils.jsx";

export function literalBuilder(type: LiteralType) {
  switch (type.kind) {
    case "String":
      return [call("literal", `"${type.value}"`)];
    case "Number":
    case "Boolean":
      return [call("literal", `${type.value}`)];
  }
}
