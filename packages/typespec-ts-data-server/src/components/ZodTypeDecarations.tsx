import { refkey } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { ZodTypeDeclaration } from "typespec-zod";
import { modelWithVisibility } from "../utils.js";
export interface ZodTypeDeclarationProps {
  type: Model;
}
export function ZodTypeDeclarations(props: ZodTypeDeclarationProps) {
  const readModel = modelWithVisibility(props.type, "Read");
  const createModel = modelWithVisibility(props.type, "Create");
  const updateModel = modelWithVisibility(props.type, "Update");

  return <>
    <ZodTypeDeclaration type={readModel} export name={"Zod" + props.type.name + "Read"} refkey={refkey(props.type, "zod-schema-read")} />
    <ZodTypeDeclaration type={createModel} export name={"Zod" + props.type.name + "Create"} refkey={refkey(props.type, "zod-schema-create")} />
    <ZodTypeDeclaration type={updateModel} export name={"Zod" + props.type.name + "Update"} refkey={refkey(props.type, "zod-schema-update")} />
  </>;
}
