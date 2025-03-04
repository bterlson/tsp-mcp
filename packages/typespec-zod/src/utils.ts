import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { ZodTypeProps } from "./components/ZodType.jsx";

export function getAllPropertyConstraints(type: Type): Constraints {
  const constraints: Constraints = {};

  if ($.modelProperty.is(type)) {
    if (type.optional) {
      constraints.itemOptional = true;
    }
    getLocalPropertyConstraints(type, constraints);
    getLocalPropertyConstraints(type.type, constraints);
    if ($.scalar.is(type.type) && type.type.baseScalar) {
      getLocalPropertyConstraints(type.type.baseScalar, constraints);
    }
  } else {
    getLocalPropertyConstraints(type, constraints);
    if ($.scalar.is(type) && type.baseScalar) {
      getLocalPropertyConstraints(type.baseScalar, constraints);
    }
  }

  return constraints;
}

export type ConstraintKey = keyof NumericConstraints;
export function getLocalPropertyConstraints(
  type: Type,
  constraints: Constraints
) {
  const constraintTypes: {
    key: ConstraintKey;
    value: number | undefined;
    comparator: (a: number, b: number) => boolean;
  }[] = [
    {
      key: "minItems",
      value: $.type.minItems(type),
      comparator: (a, b) => a > b,
    },
    {
      key: "maxItems",
      value: $.type.maxItems(type),
      comparator: (a, b) => a < b,
    },
    {
      key: "minValue",
      value: $.type.minValue(type),
      comparator: (a, b) => a > b,
    },
    {
      key: "maxValue",
      value: $.type.maxValue(type),
      comparator: (a, b) => a < b,
    },
    {
      key: "minLength",
      value: $.type.minLength(type),
      comparator: (a, b) => a > b,
    },
    {
      key: "maxLength",
      value: $.type.maxLength(type),
      comparator: (a, b) => a < b,
    },
  ];

  constraintTypes.forEach(({ key, value, comparator }) => {
    constraints[key] = updateConstraint(constraints[key], value, comparator);
  });
}

export interface NumericConstraints {
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}

export type Constraints = NumericConstraints & {
  itemOptional?: boolean;
};

function updateConstraint<T>(
  constraint: T | undefined,
  newValue: T | undefined,
  comparator: (a: T, b: T) => boolean
): T | undefined {
  if (
    newValue !== undefined &&
    (constraint === undefined || comparator(newValue, constraint))
  ) {
    return newValue;
  }
  return constraint;
}

export function ZodNumericConstraints(
  props: ZodTypeProps,
  minBasic: number | undefined,
  maxBasic: number | undefined
): string {
  const minValue = props.constraints.minValue;
  const maxValue = props.constraints.maxValue;
  const min: string =
    minValue !== undefined
      ? `.min(${minValue})`
      : minBasic !== undefined
        ? `.min(${minBasic})`
        : "";
  const max: string =
    maxValue !== undefined
      ? `.max(${maxValue})`
      : maxBasic !== undefined
        ? `.max(${maxBasic})`
        : "";
  const minmax = min + max;
  return minmax;
}

export function ZodBigIntConstraints(
  props: ZodTypeProps,
  minBasic: bigint | undefined,
  maxBasic: bigint | undefined
): string {
  const minValue = props.constraints.minValue;
  const maxValue = props.constraints.maxValue;
  const min: string =
    minValue !== undefined
      ? `.gte(${minValue}n)`
      : minBasic !== undefined
        ? `.gte(${minBasic}n)`
        : "";
  const max: string =
    maxValue !== undefined
      ? `.lte(${maxValue}n)`
      : maxBasic !== undefined
        ? `.lte(${maxBasic}n)`
        : "";
  const minmax = min + max;
  return minmax;
}

export function ZodStringConstraints(props: ZodTypeProps): string {
  const minLength = props.constraints.minLength;
  const maxLength = props.constraints.maxLength;
  const min: string = minLength !== undefined ? `.min(${minLength})` : "";
  const max: string = maxLength !== undefined ? `.max(${maxLength})` : "";
  const minmax = min + max;
  return minmax;
}

export function ZodArrayConstraints(props: ZodTypeProps): string {
  const minItems = props.constraints.minItems;
  const maxItems = props.constraints.maxItems;
  const min: string = minItems !== undefined ? `.min(${minItems})` : "";
  const max: string = maxItems !== undefined ? `.max(${maxItems})` : "";
  const minmax = min + max;
  return minmax;
}
