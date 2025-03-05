import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { zod } from "../external-packages/zod.js";
import { Constraints, getAllPropertyConstraints, ZodArrayConstraints } from "../utils.js";
import { ZodObject } from "./ZodObject.jsx";
import { ZodScalarIntrinsic } from "./ZodScalarIntrinsic.jsx";

export interface ZodTypeProps {
  type: Type;
  constraints?: Constraints;
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
export function ZodType(props: ZodTypeProps) {
  let optString = "";
  if (props.constraints?.itemOptional) {
    optString = ".optional()";
  }

  switch (props.type.kind) {
    case "Scalar":
    case "Intrinsic":
      return <ZodScalarIntrinsic {...props} />;
    case "Boolean":
      return <>
          {zod.z}.boolean(){optString}
        </>;
    case "String":
      return <>
          {zod.z}.string(){optString}
        </>;
    case "Number":
      return <>
          {zod.z}.number(){optString}
        </>;
  }

  if ($.model.is(props.type)) {
    if ($.model.isExpresion(props.type)) {
      return <ZodObject type={props.type} />;
    }

    if ($.array.is(props.type)) {
      if (props.type.indexer !== undefined) {
        const elementType = props.type.indexer.value;
        const elementConstraints: Constraints = getAllPropertyConstraints(elementType);
        const arrayConstraints = ZodArrayConstraints(props);
        return <>
            {zod.z}.array(
            <ZodType type={elementType} constraints={elementConstraints} />)
            {arrayConstraints}
            {optString}
          </>;
      }
    }

    if ($.record.is(props.type)) {
      if (props.type.indexer !== undefined) {
        const elementType = props.type.indexer.value;
        const elementConstraints: Constraints = getAllPropertyConstraints(elementType);
        return <>
            {zod.z}.record(z.string(),
            <ZodType type={elementType} constraints={elementConstraints} />)
            {optString}
          </>;
      }
    }

    // Just a plain-old model - reference it instead of emitting it inline
    const namePolicy = ts.useTSNamePolicy();
    const modelName = namePolicy.getName(props.type.name, "variable");
    return <>
        {modelName}
        {optString}
      </>;
  }

  // Unions
  if ($.union.is(props.type)) {
    const unionTypes = props.type.variants;

    const unionTypeNames = ay.mapJoin(
      unionTypes,
      (name, entry) => {
        const elementConstraints: Constraints = getAllPropertyConstraints(entry.type);
        return <ZodType type={entry.type} constraints={elementConstraints} />;
      },
      { joiner: ", " },
    );

    return <>
        {zod.z}.union([ {unionTypeNames} ]){optString}
      </>;
  }

  // Reference to another model property
  if ($.modelProperty.is(props.type)) {
    const propConstraints = getAllPropertyConstraints(props.type);
    return <>
        <ZodType type={props.type.type} constraints={propConstraints} />
        {optString}
      </>;
  }
  return <>
      {zod.z}.any(){optString}
    </>;
}
