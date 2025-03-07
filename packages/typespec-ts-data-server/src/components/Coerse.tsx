import { Children } from "@alloy-js/core";
import { Scalar } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";

export interface CoerceProps {
  from: Scalar;
  to: Scalar;
  children?: Children;
}

export function Coerce(props: CoerceProps) {
  // todo typekit: generic extends
  if (props.from === props.to) {
    return props.children;
  }

  if ($.scalar.extendsNumeric(props.to)) {
    return <>Number({props.children})</>;
  }

  if ($.scalar.extendsString(props.to)) {
    return <>String({props.children})</>;
  }
}
