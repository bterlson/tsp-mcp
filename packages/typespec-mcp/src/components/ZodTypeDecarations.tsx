import { refkey, StatementList } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { ZodTypeDeclaration } from "typespec-zod";
import { debugLog, getKeyProp, isErrorModel, modelWithVisibility, sanitizePropertyName } from "../utils.js";

export interface ZodTypeDeclarationProps {
  type: Model;
}

export function ZodTypeDeclarations(props: ZodTypeDeclarationProps) {
  // Special handling for error models - using the centralized isErrorModel function
  if (isErrorModel(props.type)) {
    // Sanitize model name if needed
    return (
      <StatementList>
        <ZodTypeDeclaration
          type={props.type}
          export
          name={"Zod" + props.type.name}
          refkey={refkey(props.type, "zod-schema-error")}
        />
      </StatementList>
    );
  }
  
  const keyProp = getKeyProp(props.type);
  
  // Early return if no key property is found for non-error models
  if (!keyProp) {
    debugLog(`No key property found for model ${props.type.name}`);
    return null;
  }
  
  const createModel = modelWithVisibility(props.type, "Create");
  const updateModel = modelWithVisibility(props.type, "Update");

  // Make sure key property is sanitized when added to the updateModel
  const sanitizedKeyName = sanitizePropertyName(keyProp.name);
  updateModel.properties.set(sanitizedKeyName, keyProp);

  const getModel = $.model.create({
    name: props.type.name + "Get",
    properties: {
      [sanitizedKeyName]: keyProp,
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
      <ZodTypeDeclaration
        type={getModel}
        export
        name={"Zod" + props.type.name + "Delete"}
        refkey={refkey(props.type, "zod-schema-delete")}
      />
    </StatementList>
  );
}
