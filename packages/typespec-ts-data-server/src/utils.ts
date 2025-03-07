import {
  $withOptionalProperties,
  $withVisibilityFilter,
  getLifecycleVisibilityEnum,
  isKey,
  Model,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import pluralize from "pluralize";

export function resourceName(type: Model) {
  return pluralize(type.name);
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
