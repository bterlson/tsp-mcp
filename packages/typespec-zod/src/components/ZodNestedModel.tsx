import { Model } from "@typespec/compiler";
import * as ts from "@alloy-js/typescript";
import { zod } from "../external-packages/zod.js";
import { ZodModelProperties } from "./ZodModelProperties.jsx";

export interface ModelProps {
  model: Model;
}

export function ZodNestedModel(props: ModelProps) {
  const namePolicy = ts.useTSNamePolicy();
  const modelName = namePolicy.getName(props.model.name, "variable");
  return (
    <>
      {modelName} {zod.z}.object( &#123;
      <ZodModelProperties model={props.model} />
      &#125; )
    </>
  );
}
