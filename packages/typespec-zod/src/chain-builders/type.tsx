import { Children } from "@alloy-js/core/jsx-runtime";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { call } from "../utils.jsx";
import { enumBuilder } from "./enum.jsx";
import { intrinsicBuilder } from "./intrinsic.jsx";
import { literalBuilder } from "./literal.jsx";
import { modelBuilder } from "./model.jsx";
import { scalarBuilder } from "./scalar.jsx";
import { tupleBuilder } from "./tuple.jsx";
import { unionBuilder } from "./union.jsx";

export function typeBuilder(type: Type): Children[] {
  const components: Children[] = [];
  
  // Check if this might be an unresolved symbol 
  // (we can't directly check for "UnresolvedType" as it's not in the type union)
  if ((type as any).__unresolved === true || (type as any).kind === "UnresolvedType") {
    const modelName = getModelName(type) || "Unknown";
    const propertyName = getPropertyName(type) || "Unknown";
    
    console.log(`Model ${modelName} property ${propertyName} has an unresolved symbol, defaulting to z.unknown().`);
    components.push(call("unknown"));
    return components;
  }
  
  switch (type.kind) {
    case "Intrinsic":
      components.push(...intrinsicBuilder(type));
      break;
    case "String":
    case "Number":
    case "Boolean":
      components.push(...literalBuilder(type));
      break;
    case "Scalar":
      components.push(...scalarBuilder(type));
      break;
    case "Model":
      components.push(...modelBuilder(type));
      break;
    case "Union":
      components.push(...unionBuilder(type));
      break;
    case "Enum":
      components.push(...enumBuilder(type));
      break;
    case "ModelProperty":
      components.push(...typeBuilder(type.type));
      break;
    case "EnumMember":
      components.push(
        ...(type.value
          ? [literalBuilder($.literal.create(type.value))]
          : [literalBuilder($.literal.create(type.name))]),
      );
      break;
    case "Tuple":
      components.push(...tupleBuilder(type));
      break;
    default:
      console.log(`Unhandled type kind: ${type.kind || "unknown"}, defaulting to z.unknown().`);
      components.push(call("unknown"));
  }

  return components;
}

/**
 * Try to get the model name from a type
 */
function getModelName(type: Type): string | undefined {
  return (type as any).parent?.name || (type as any).modelName;
}

/**
 * Try to get the property name from a type
 */
function getPropertyName(type: Type): string | undefined {
  return (type as any).name || (type as any).propertyName;
}
