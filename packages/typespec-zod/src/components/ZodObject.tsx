import { Model } from "@typespec/compiler";
import { zod } from "../external-packages/zod.js";
import { ZodModelProperties } from "./ZodModelProperties.jsx";

export interface ModelProps {
  type: Model;
}

export function ZodObject(props: ModelProps) {
  return <>
    {zod.z}.object({"{"}
      <ZodModelProperties model={props.type} />
    {"}"})
  </>;
}
