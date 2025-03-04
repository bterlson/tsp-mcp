/* Important notes:*/

// Note: the Prettier extension for VS Code is not formatting the React fragments correctly.
// If you turn it on and save your file, it will insert newlines within the fragments, which results in
// incorrect Zod code being emitted.  Please don't use it in this file.
// You can turn off the Prettier extension for this file by adding  "files.exclude": { "**/efv2-zod-sketch/src/emitter.tsx": true } to your .vscode/settings.json file.
// You can also turn off the Prettier extension for all files by adding "editor.formatOnSave": false to your  .vscode/settings.json file.

/**
 * Known remaining TODO items:
 * - (1) Need a way to acquire models in reference-order, so that we can emit models that reference other models.
 *       without getting errors in the emit code.  For example, consider the following models:
 *        model A {
 *          prop1: B[]
 *        }
 *        model B {
 *          prop2: string
 *        }
 *   This is perfectly legal TypeSpec, because TypeSpec is not order-dependent.  However, when we emit the models in Zod
 *   (i.e. TypeScript), we need to emit B before A, because A references B:
 *        export const A = z.object({
 *          prop1: z.array(B) // ERROR!  B is not defined yet!
 *        });
 *        export const B = z.object({
 *          prop2: z.string()
 *        });
 *
 *   The efv2 folks are investigating a fix that will allow access to an ordered list of models.
 * */

/* Key scripts for building and running this emitter
Build from the root of the project:
  pnpm --filter efv2-zod-sketch... build

Build, babel, and debug from packages\efv2-zod-sketch:
  pnpm run build
  npx babel src -d dist/src --extensions '.ts,.tsx'
  pnpm build-todo
*/

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {
  EmitContext,
  Enum,
  EnumMember,
  Model,
  navigateType,
  Type,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { zod } from "./external-packages/zod.js";
import { writeOutput } from "@typespec/emitter-framework";
export async function $onEmit(context: EmitContext) {
  // Get all models
  const models = getModels();
  const enums = getEnums();
  const tsNamePolicy = ts.createTSNamePolicy();

  // Emit all enums and models
  writeOutput(
    <ay.Output namePolicy={tsNamePolicy} externals={[zod]}>
      <ts.PackageDirectory name="test-package" version="0.0.1" path=".">
        <ay.SourceDirectory path="src">
          <ts.SourceFile path="models.ts">
            {ay.mapJoin(
              enums,
              (enumInstance) => {
                return <ZodEnum enum={enumInstance} />;
              },
              { joiner: "\n\n" }
            )}

            {ay.mapJoin(
              models,
              (model) => {
                return <ZodModel model={model} />;
              },
              { joiner: "\n\n" }
            )}
          </ts.SourceFile>
        </ay.SourceDirectory>
      </ts.PackageDirectory>
    </ay.Output>,
    context.emitterOutputDir
  );
}

/** Model support */

interface ModelProps {
  model: Model;
}

interface EnumProps {
  enum: Enum;
}

type NumericConstraints = {
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
};

type Constraints = NumericConstraints & {
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

type ConstraintKey = keyof NumericConstraints;
function getLocalPropertyConstraints(type: Type, constraints: Constraints) {
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
/**
 * Component that represents a collection of Zod Model properties
 */
function ZodModelProperties(props: ZodModelPropertiesProps) {
  const namePolicy = ts.useTSNamePolicy();

  return ay.mapJoin(
    props.model.properties,
    (name, prop) => {
      const propName = namePolicy.getName(name, "object-member-data");
      const propConstraints = getAllPropertyConstraints(prop);
      return (
        <>
          {propName}: <ZodType type={prop.type} constraints={propConstraints} />
        </>
      );
    },
    { joiner: ",\n" }
  );
}

function getAllPropertyConstraints(type: Type): Constraints {
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

interface ZodTypeProps {
  type: Type;
  constraints: Constraints;
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
function ZodType(props: ZodTypeProps) {
  let optString = "";
  if (props.constraints.itemOptional) {
    optString = ".optional()";
  }

  switch (props.type.kind) {
    case "Scalar":
    case "Intrinsic":
      return getScalarIntrinsicZodType(props);
    case "Boolean":
      return (
        <>
          {zod.z}.boolean(){optString}
        </>
      );
    case "String":
      return (
        <>
          {zod.z}.string(){optString}
        </>
      );
    case "Number":
      return (
        <>
          {zod.z}.number(){optString}
        </>
      );
  }

  if ($.model.is(props.type)) {
    if ($.model.isExpresion(props.type)) {
      return <ZodNestedModel model={props.type} />;
    }

    if ($.array.is(props.type)) {
      if (props.type.indexer !== undefined) {
        const elementType = props.type.indexer.value;
        const elementConstraints: Constraints =
          getAllPropertyConstraints(elementType);
        const arrayConstraints = ZodArrayConstraints(props);
        return (
          <>
            {zod.z}.array(
            <ZodType type={elementType} constraints={elementConstraints} />)
            {arrayConstraints}
            {optString}
          </>
        );
      }
    }

    if ($.record.is(props.type)) {
      if (props.type.indexer !== undefined) {
        const elementType = props.type.indexer.value;
        const elementConstraints: Constraints =
          getAllPropertyConstraints(elementType);
        return (
          <>
            {zod.z}.record(z.string(),
            <ZodType type={elementType} constraints={elementConstraints} />)
            {optString}
          </>
        );
      }
    }

    // Just a plain-old model - reference it instead of emitting it inline
    const namePolicy = ts.useTSNamePolicy();
    const modelName = namePolicy.getName(props.type.name, "variable");
    return (
      <>
        {modelName}
        {optString}
      </>
    );
  }

  // Unions
  if ($.union.is(props.type)) {
    const unionTypes = props.type.variants;

    const unionTypeNames = ay.mapJoin(
      unionTypes,
      (name, entry) => {
        const elementConstraints: Constraints = getAllPropertyConstraints(
          entry.type
        );
        return <ZodType type={entry.type} constraints={elementConstraints} />;
      },
      { joiner: ", " }
    );

    return (
      <>
        {zod.z}.union([ {unionTypeNames} ]){optString}
      </>
    );
  }

  // Reference to another model property
  if ($.modelProperty.is(props.type)) {
    const propConstraints = getAllPropertyConstraints(props.type);
    return (
      <>
        <ZodType type={props.type.type} constraints={propConstraints} />
        {optString}
      </>
    );
  }
  return (
    <>
      {zod.z}.any(){optString}
    </>
  );
}

function ZodNestedModel(props: ModelProps) {
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

function getScalarIntrinsicZodType(props: ZodTypeProps): string {
  // IMPORTANT:  Please note that all scalar handlers in this method must be organized from most narrow
  // to least narrow. This is because the scalar handlers are not mutually exclusive due to use of .extendsXXX(),
  // and the first one that matches will be used, causing incorrect bit-limitation constraints to be applied
  // (or skipped altogether).

  let optString = "";
  if (props.constraints.itemOptional) {
    optString = ".optional()";
  }

  // In TypeSpec, null is an intrinsic type (typically used in a union) rather than a qualifier on a type,
  // like the decorator "@optional".  This means it's easier for us to emit the Zod version as z.null() instead of
  // appending .nullable to the z.union() (etc.) element; the alternative would be to add a special case inside the union
  // handlng code -- specifically in the ay.mapJoin() sub-call in the ZodType() function where we'd have to
  // ignore the null type when emitting the union but keep track of having seen it so we can append .nullable() to the
  // Not worth it, since the current way still creates legal Zod code without any special casing.
  if (props.type.kind === "Intrinsic" && props.type.name === "null") {
    return (
      <>
        {zod.z}.null(){optString}
      </>
    );
  }

  if ($.scalar.is(props.type)) {
    // Types with parity in Zod
    if ($.scalar.extendsBoolean(props.type)) {
      return (
        <>
          {zod.z}.boolean(){optString}
        </>
      );
    }

    if ($.scalar.extendsBytes(props.type)) {
      return (
        <>
          {zod.z}.string(){optString}
        </>
      );
    }

    // Numbers
    // Bit limitations don't translate very well for floats, since they really
    // affect precision and not min/max values (i.e. a mismatch won't
    // cause an overflow but just a truncation in accuracy).  We will leave these as
    // numbers.
    if ($.scalar.extendsFloat(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsFloat32(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsFloat64(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    // With integers, though, we completely understand the range and can parse to it.
    if ($.scalar.extendsInt8(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, -128, 127)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInt16(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, -32768, 32767)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInt32(props.type)) {
      return (
        <>
          {zod.z}.number()
          {ZodNumericConstraints(props, -2147483648, 2147483647)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsSafeint(props.type)) {
      return (
        <>
          {zod.z}.number().safe()
          {ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInt64(props.type)) {
      return (
        <>
          {zod.z}.bigint()
          {ZodBigIntConstraints(
            props,
            -9223372036854775808n,
            9223372036854775807n
          )}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint8(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative()
          {ZodNumericConstraints(props, undefined, 255)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint16(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative()
          {ZodNumericConstraints(props, undefined, 65535)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint32(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative()
          {ZodNumericConstraints(props, undefined, 4294967295)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint64(props.type)) {
      return (
        <>
          {zod.z}.bigint().nonnegative()
          {ZodBigIntConstraints(props, undefined, 18446744073709551615n)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInteger(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    if ($.scalar.extendsUrl(props.type)) {
      return (
        <>
          {zod.z}.string().url(){optString}
        </>
      );
    }

    if ($.scalar.extendsString(props.type)) {
      return (
        <>
          {zod.z}.string(){ZodStringConstraints(props)}
          {optString}
        </>
      );
    }

    if ($.scalar.extendsDecimal(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    // isDecimal128 is problematic.  If intended to be a whole number (integer), it must be less than 2^53-1 and thus
    // can't be represented as a number in JavaScript without using BigInt.  But BigInt
    // makes no sense if this is a floating point number.  We will leave this as a number.
    // Since Decimal128 is a 128-bit floating point number, we'll take the hit in
    // precision if an integer.
    if ($.scalar.extendsDecimal128(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    if ($.scalar.extendsNumeric(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    //Dates and times
    if ($.scalar.extendsOffsetDateTime(props.type)) {
      const encoding = $.scalar.getEncoding(props.type);
      if (encoding?.encoding === "unixTimestamp") {
        return (
          <>
            {zod.z}.number().int(){optString}
          </>
        );
      }
      return (
        <>
          {zod.z}.string().datetime(&#123;offset: true&#125;){optString}
        </>
      );
    }
    if ($.scalar.extendsUtcDateTime(props.type)) {
      const encoding = $.scalar.getEncoding(props.type);
      if (encoding?.encoding === "unixTimestamp") {
        return (
          <>
            {zod.z}.number().int(){optString}
          </>
        );
      }
      return (
        <>
          {zod.z}.string().datetime(){optString}
        </>
      );
    }
    if ($.scalar.extendsDuration(props.type)) {
      return (
        <>
          {zod.z}.string().duration(){optString}
        </>
      );
    }
    if ($.scalar.extendsPlainDate(props.type)) {
      return (
        <>
          {zod.z}.string().date(){optString}
        </>
      );
    }
    if ($.scalar.extendsPlainTime(props.type)) {
      return (
        <>
          {zod.z}.string().time(){optString}
        </>
      );
    }
  }
  return (
    <>
      {zod.z}.any(){optString}
    </>
  );
}

function ZodNumericConstraints(
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

function ZodBigIntConstraints(
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

function ZodStringConstraints(props: ZodTypeProps): string {
  const minLength = props.constraints.minLength;
  const maxLength = props.constraints.maxLength;
  const min: string = minLength !== undefined ? `.min(${minLength})` : "";
  const max: string = maxLength !== undefined ? `.max(${maxLength})` : "";
  const minmax = min + max;
  return minmax;
}

function ZodArrayConstraints(props: ZodTypeProps): string {
  const minItems = props.constraints.minItems;
  const maxItems = props.constraints.maxItems;
  const min: string = minItems !== undefined ? `.min(${minItems})` : "";
  const max: string = maxItems !== undefined ? `.max(${maxItems})` : "";
  const minmax = min + max;
  return minmax;
}

/**
 * Collects all the models defined in the spec
 * @returns A collection of all defined models in the spec
 */
function getModels() {
  // This method is temporary until we have a way to get models in reference order from the efv2 team.
  // Currently, the models are emitted in the order they are found in the spec, which can cause issues.
  // In the interim, make sure to define models in the TypeSpec in reference-order or you may get errors
  // when emitting the models.

  const models = new Set<Model>();

  const globalNs = $.program.getGlobalNamespaceType();

  // There might be models defined in the global namespace. For example https://bit.ly/4fTYkD6
  const globalModels = Array.from(globalNs.models.values());

  // Get all namespaces defined in the spec, excluding TypeSpec namespace.
  const specNamespaces = Array.from(globalNs.namespaces.values()).filter(
    (ns) => !ns.name.startsWith("TypeSpec")
  );

  for (const ns of specNamespaces) {
    navigateType(
      ns,
      {
        model(model) {
          // Ignore models from TypeSpec namespace, i.e Array or Record
          // We only want models defined in the spec
          if (model.namespace && model.namespace.name === "TypeSpec") {
            return;
          }
          models.add(model);
        },
      },
      { includeTemplateDeclaration: false }
    );
  }

  return [...globalModels, ...models];
}

/**
 * Component that represents a Zod Model
 */
function ZodModel(props: ModelProps) {
  const namePolicy = ts.useTSNamePolicy();
  const modelName = namePolicy.getName(props.model.name, "variable");

  // Don't emit models without names -- those are nested models
  if (modelName.length === 0) return "";

  return (
    <ts.VarDeclaration export name={modelName}>
      {zod.z}.object(
      {ay.code`{
         ${(<ZodModelProperties model={props.model} />)}
      }`}
      )
    </ts.VarDeclaration>
  );
}

interface ZodModelPropertiesProps {
  model: Model;
}

/** Enums */
/** Note that we will emit all enums as typescript native enums, because
 * they are a superset of Zod enums.  Zod actually recommends that you use
 * Zod enums whenever possible, but they only support strings and since there's
 * a very good change that the enum will be a number, we need to be more
 * inclusive.
 * 
 * When using a native typescript enum, the Zod code will need to use "z.nativeEnum()"
 * and then infer the enum into a type.
 * For example, the enum:
 *   export const enum todoStatus
      {
      notStarted,
      inProgress,
      completed
      };
 * would be accessed & used in Zod as:
    const TodoStatusEnum = z.nativeEnum(todoStatus);
    type TodoStatusEnum = z.infer<typeof TodoStatusEnum>;
    TodoStatusEnum.parse("notStarted"); // Passes
    TodoStatusEnum.parse("chipmunks"); // Fails
    */

function ZodEnum(props: EnumProps) {
  const namePolicy = ts.useTSNamePolicy();
  const enumName = namePolicy.getName(props.enum.name, "variable");
  const enumCall = "export const enum " + enumName + "\n";
  const enumMembers = ZodEnumMembers(props);
  const enumBody = enumCall + "{\n" + enumMembers + "\n};\n";
  return enumBody;
}

interface ZodEnumMembersProps {
  enum: Enum;
}

function ZodEnumMembers(props: ZodEnumMembersProps) {
  const namePolicy = ts.useTSNamePolicy();
  const array: string[] = [];
  props.enum.members.forEach((value: EnumMember) => {
    const memberName = namePolicy.getName(value.name, "variable");
    if (value.value !== undefined) {
      if (typeof value.value === "string") {
        array.push(memberName + ' = "' + value.value + '"');
      } else {
        array.push(memberName + " = " + value.value);
      }
    } else {
      array.push(memberName);
    }
  });
  return array.join(",\n");
}

/**
 * Collects all the enums defined in the spec
 * @returns A collection of all defined enums in the spec
 */
function getEnums() {
  const enums = new Set<Enum>();
  const globalNs = $.program.getGlobalNamespaceType();
  const globalEnums = Array.from(globalNs.enums.values());
  const specNamespaces = Array.from(globalNs.namespaces.values()).filter(
    (ns) => !ns.name.startsWith("TypeSpec")
  );

  for (const ns of specNamespaces) {
    navigateType(
      ns,
      {
        enum(enumType) {
          enums.add(enumType);
        },
      },
      { includeTemplateDeclaration: false }
    );
  }

  return [...globalEnums, ...enums];
}
