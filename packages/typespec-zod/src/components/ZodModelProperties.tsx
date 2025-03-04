import { mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model } from "@typespec/compiler";
import { getAllPropertyConstraints } from "../utils.js";
import { ZodType } from "./ZodType.jsx";

export interface ZodModelPropertiesProps {
  model: Model;
}

/**
 * Component that represents a collection of Zod Model properties
 */
export function ZodModelProperties(props: ZodModelPropertiesProps) {
  const namePolicy = ts.useTSNamePolicy();

  return mapJoin(
    props.model.properties,
    (name, prop) => {
      const propName = namePolicy.getName(name, "object-member-data");
      const propConstraints = getAllPropertyConstraints(prop);
      return (
        <>
          {propName}: <ZodType type={prop.type} constraints={propConstraints} />
        </>
      );
    },
    { joiner: ",\n" }
  );
}
