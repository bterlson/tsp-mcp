import { $withVisibilityFilter, getLifecycleVisibilityEnum, Model } from "@typespec/compiler";
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

  return clone;
}
