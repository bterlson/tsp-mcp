import { zod } from "../external-packages/zod.js";
import { ZodModelProperties } from "./ZodModelProperties.jsx";
import { ModelProps } from "./ZodNestedModel.jsx";
import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

/**
 * Component that represents a Zod Model
 */
export function ZodModel(props: ModelProps) {
  const namePolicy = ts.useTSNamePolicy();
  const modelName = namePolicy.getName(props.model.name, "variable");

  // Don't emit models without names -- those are nested models
  if (modelName.length === 0) return "";

  return (
    <ts.VarDeclaration export name={modelName}>
      {zod.z}.object(
      {ay.code`{
         ${(<ZodModelProperties model={props.model} />)}
      }`}
      )
    </ts.VarDeclaration>
  );
}
