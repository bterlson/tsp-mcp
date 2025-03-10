import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { refkeySym } from "../utils.js";
import { ZodType, ZodTypeProps } from "./ZodType.jsx";

interface ZodTypeDeclarationProps
  extends Omit<ts.VarDeclarationProps, "type" | "name">,
    ZodTypeProps {
  name?: string;
}

/**
 * Declare a Zod schema.
 */
export function ZodTypeDeclaration(props: ZodTypeDeclarationProps) {
  const internalRk = ay.refkey(props.type, refkeySym);
  const refkeys = props.refkeys ?? [];
  refkeys.push(internalRk);
  // todo: use split props
  return (
    <ts.VarDeclaration
      export={props.export}
      refkey={props.refkey}
      refkeys={refkeys}
      name={props.name ?? (props.type as any).name}
    >
      <ZodType type={props.type} />
    </ts.VarDeclaration>
  );
}
