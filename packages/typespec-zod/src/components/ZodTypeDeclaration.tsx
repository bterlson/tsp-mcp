import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ZodEnum } from "./ZodEnum.jsx";
import { ZodObject } from "./ZodObject.jsx";
import { ZodType, ZodTypeProps } from "./ZodType.jsx";

interface ZodTypeDeclarationProps
  extends Omit<ts.VarDeclarationProps, "type" | "name">,
    ZodTypeProps {
  tsType?: ay.Children;
  name?: string;
}
/**
 * Declare a Zod schema.
 */
export function ZodTypeDeclaration(props: ZodTypeDeclarationProps) {
  // TypeKit - isDeclaration, isExpression
  if (
    !props.name &&
    (!("name" in props.type) ||
      props.type.name === undefined ||
      typeof props.type.name === "symbol")
  ) {
    return "";
  }
  let typeDeclaration;
  switch (props.type.kind) {
    case "Model":
      typeDeclaration = <ZodObject type={props.type}/>;
      break;
    case "Enum":
      typeDeclaration = <ZodEnum type={props.type} />;
      break;
    default:
      typeDeclaration = <ZodType type={props.type} />;
      break;
  }
  // todo: use split props
  return <ts.VarDeclaration export={props.export} refkey={props.refkey} name={props.name ?? (props.type as any).name}>
    {typeDeclaration}
  </ts.VarDeclaration>;
}
