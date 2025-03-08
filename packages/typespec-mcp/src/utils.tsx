import { refkey } from "@alloy-js/core";
import { FunctionCallExpression } from "@alloy-js/typescript";
import {
  $withOptionalProperties,
  $withVisibilityFilter,
  getLifecycleVisibilityEnum,
  isKey,
  Model,
  Type,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { capitalCase, snakeCase } from "change-case";
import pluralize from "pluralize";
import { zodToJsonSchema } from "./externals.js";

export function resourceName(type: Type) {
  if (!$.model.is(type) || $.model.isExpresion(type)) {
    throw new Error("Non-model decls not supported");
  }

  return pluralize(type.name);
}

export function toolNameForType(
  type: Type,
  action: "list" | "get" | "create" | "update" | "delete",
) {
  if (!$.model.is(type) || $.model.isExpresion(type)) {
    throw new Error("Non-model decls not supported");
  }
  const snakeCaseName = snakeCase(type.name);
  const snakeCaseNamePlural = pluralize(snakeCaseName);
  switch (action) {
    case "list":
      return `list_${snakeCaseNamePlural}`;
    case "get":
      return `get_${snakeCaseName}`;
    case "create":
      return `create_${snakeCaseName}`;
    case "update":
      return `update_${snakeCaseName}`;
    case "delete":
      return `delete_${snakeCaseName}`;
  }
}

export function typeToToolDescriptors(type: Type) {
  if (!$.model.is(type) || $.model.isExpresion(type)) {
    return {};
  }

  const keyProp = getKeyProp(type)!;
  const pluralName = pluralize(type.name);
  const englishName = capitalCase(type.name);
  const englishNamePlural = capitalCase(pluralName);

  return [
    {
      name: toolNameForType(type, "list"),
      description: `List all ${englishNamePlural}.`,
    },
    {
      name: toolNameForType(type, "get"),
      description: `Get a ${englishName} by ${keyProp.name}.`,
    },
    {
      name: toolNameForType(type, "create"),
      description: `Create a ${englishName}.`,
      inputSchema: () => (
        <FunctionCallExpression
          target={zodToJsonSchema.zodToJsonSchema}
          args={[refkey(type, "zod-schema-create")]}
        />
      ),
    },
    {
      name: toolNameForType(type, "update"),
      description: `Update a ${englishName} by ${keyProp.name}.`,
      inputSchema: () => (
        <FunctionCallExpression
          target={zodToJsonSchema.zodToJsonSchema}
          args={[refkey(type, "zod-schema-update")]}
        />
      ),
    },
    {
      name: toolNameForType(type, "delete"),
      description: `Delete a ${englishName} by ${keyProp.name}.`,
    },
  ];
}

export function modelWithVisibility(
  type: Model,
  visibility: "Create" | "Read" | "Update" | "Delete" | "Query",
) {
  const clone = $.type.clone(type);
  const visibilityEnum = getLifecycleVisibilityEnum($.program);
  $withVisibilityFilter(
    {
      program: $.program,
      getArgumentTarget() {
        return undefined;
      },
    } as any,
    clone,
    {
      all: [
        {
          entityKind: "Value",
          type: visibilityEnum,
          value: visibilityEnum.members.get(visibility)!,
          valueKind: "EnumValue",
        },
      ],
    },
  );

  if (visibility === "Update") {
    $withOptionalProperties(
      {
        program: $.program,
        getArgumentTarget() {
          return undefined;
        },
      } as any,
      clone,
    );
  }

  return clone;
}

export function getKeyProp(type: Model) {
  for (const prop of type.properties.values()) {
    if (isKey($.program, prop)) {
      return prop;
    }
  }

  return null;
}

export function keyName(type: Model) {
  const keyProp = getKeyProp(type);
  if (!keyProp) {
    throw new Error("No key property found");
  }
  return keyProp.name;
}
