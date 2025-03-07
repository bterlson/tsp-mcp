import { List, refkey } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { InterfaceDeclaration } from "@typespec/emitter-framework/typescript";
import { modelWithVisibility } from "../utils.js";
export interface TsTypeDeclarationProps {
  type: Model;
}
export function TsTypeDeclarations(props: TsTypeDeclarationProps) {
  const readModel = modelWithVisibility(props.type, "Read");
  const createModel = modelWithVisibility(props.type, "Create");
  const updateModel = modelWithVisibility(props.type, "Update");
  return (
    <List hardline>
      <InterfaceDeclaration
        type={readModel}
        export
        name={props.type.name + "Read"}
        refkey={refkey(props.type, "ts-read")}
      />
      <InterfaceDeclaration
        type={createModel}
        export
        name={props.type.name + "Create"}
        refkey={refkey(props.type, "ts-create")}
      />
      <InterfaceDeclaration
        type={updateModel}
        export
        name={props.type.name + "Update"}
        refkey={refkey(props.type, "ts-update")}
      />
    </List>
  );
}
