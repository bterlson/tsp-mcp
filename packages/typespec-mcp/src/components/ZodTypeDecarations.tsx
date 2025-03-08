import { refkey, StatementList } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { ZodTypeDeclaration } from "typespec-zod";
import { getKeyProp, modelWithVisibility } from "../utils.js";
export interface ZodTypeDeclarationProps {
  type: Model;
}
export function ZodTypeDeclarations(props: ZodTypeDeclarationProps) {
  const keyProp = getKeyProp(props.type)!;
  const createModel = modelWithVisibility(props.type, "Create");
  const updateModel = modelWithVisibility(props.type, "Update");

  updateModel.properties.set(keyProp.name, keyProp);

  const getModel = $.model.create({
    name: props.type.name + "Get",
    properties: {
      [keyProp.name]: keyProp,
    },
  });

  return (
    <StatementList>
      <ZodTypeDeclaration
        type={getModel}
        export
        name={"Zod" + props.type.name + "Get"}
        refkey={refkey(props.type, "zod-schema-get")}
      />
      <ZodTypeDeclaration
        type={createModel}
        export
        name={"Zod" + props.type.name + "Create"}
        refkey={refkey(props.type, "zod-schema-create")}
      />
      <ZodTypeDeclaration
        type={updateModel}
        export
        name={"Zod" + props.type.name + "Update"}
        refkey={refkey(props.type, "zod-schema-update")}
      />
    </StatementList>
  );
}
