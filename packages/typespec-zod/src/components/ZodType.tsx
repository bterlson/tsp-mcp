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
/*
  switch (props.type.kind) {
    case "Scalar":
    case "Intrinsic":
      return <ZodScalarIntrinsic type={props.type} />;
    case "Boolean":
      return (
        <>
          {zod.z}.literal({String(props.type.value)}){optString}
        </>
      );
    case "String":
      return (
        <>
          {zod.z}.literal("{props.type.value}"){optString}
        </>
      );
    case "Number":
      return (
        <>
          {zod.z}.literal({props.type.value}){optString}
        </>
      );
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
        return (
          <>
            {zod.z}.array(
            <ZodType type={elementType} constraints={elementConstraints} />){arrayConstraints}
            {optString}
          </>
        );
      }
    }

    if ($.record.is(props.type)) {
      if (props.type.indexer !== undefined) {
        const elementType = props.type.indexer.value;
        const elementConstraints: Constraints = getAllPropertyConstraints(elementType);
        return (
          <>
            {zod.z}.record(z.string(),
            <ZodType type={elementType} constraints={elementConstraints} />){optString}
          </>
        );
      }
    }

    // Just a plain-old model - reference it instead of emitting it inline
    const namePolicy = ts.useTSNamePolicy();
    const modelName = namePolicy.getName(props.type.name, "variable");
    return (
      <>
        {modelName}
        {optString}
      </>
    );
  }

  // Unions
  if ($.union.is(props.type)) {
    const unionTypes = props.type.variants;

    const unionTypeNames = ay.mapJoin(
      () => unionTypes,
      (name, entry) => {
        const elementConstraints: Constraints = getAllPropertyConstraints(entry.type);
        return <ZodType type={entry.type} constraints={elementConstraints} />;
      },
      { joiner: ", " },
    );

    return (
      <>
        {zod.z}.union([ {unionTypeNames} ]){optString}
      </>
    );
  }

  // Reference to another model property
  if ($.modelProperty.is(props.type)) {
    const propConstraints = getAllPropertyConstraints(props.type);
    return (
      <>
        <ZodType type={props.type.type} constraints={propConstraints} />
        {optString}
      </>
    );
  }
  return (
    <>
      {zod.z}.any(){optString}
    </>
  );
  */
