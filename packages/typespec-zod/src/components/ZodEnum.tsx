/** Enums */
import * as ts from "@alloy-js/typescript";
import { Enum, EnumMember } from "@typespec/compiler";

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
export interface EnumProps {
  enum: Enum;
}
export function ZodEnum(props: EnumProps) {
  const namePolicy = ts.useTSNamePolicy();
  const enumName = namePolicy.getName(props.enum.name, "variable");
  const enumCall = "export const enum " + enumName + "\n";
  const enumMembers = ZodEnumMembers(props);
  const enumBody = enumCall + "{\n" + enumMembers + "\n};\n";
  return enumBody;
}

export interface ZodEnumMembersProps {
  enum: Enum;
}

export function ZodEnumMembers(props: ZodEnumMembersProps) {
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
