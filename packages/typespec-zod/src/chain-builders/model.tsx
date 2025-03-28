import { refkey } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { MemberChainExpression, ObjectExpression } from "@alloy-js/typescript";
import { Model, ModelProperty } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { TSValueExpression } from "../components/TSValueExpression.jsx";
import { ZodExpression } from "../components/ZodExpression.jsx";
import { ZodType } from "../components/ZodType.jsx";
import { call, isDeclaration, isRecord, isUnresolvedSymbol, refkeySym, sanitizePropertyName, shouldReference } from "../utils.jsx";
import { arrayConstraints, docBuilder, numericConstraints, stringConstraints } from "./common.jsx";
import { typeBuilder } from "./type.jsx";

export function modelBuilder(type: Model) {
  // First, check if we have an unresolved base model that is being merged with properties
  if (type.baseModel && isUnresolvedSymbol(type.baseModel)) {
    console.log(`Model ${type.name || "anonymous"} has an unresolved base model due to circular, parent, or namespace references. Using z.object() instead of merge.`);
    
    // Skip the merge with the unresolved base model and just use the properties as a standalone object
    // This ensures we don't get the z.<Unresolved Symbol>.merge(...) pattern
    if (type.properties.size > 0) {
      return objectBuilder(type);
    } else {
      // If there are no properties and the base model is unresolved, return unknown
      return [
        call("unknown"),
        call("describe", "\"This model has an unresolved base model due to circular, parent, or namespace references. Defaulting to z.unknown()\"")
      ];
    }
  }

  if ($.array.is(type)) {
    return [
      call("array", <ZodType type={type.indexer!.value} nested />),
      ...arrayConstraints(type as Model),
      ...docBuilder(type),
    ];
  }
  let components: Children[] = [];

  let recordPart: Children[] | null = null;
  let objectPart: Children[] | null = null;

  if (
    isRecord(type) ||
    (!!type.baseModel && isRecord(type.baseModel) && !isDeclaration(type.baseModel))
  ) {
    recordPart = [
      call(
        "record",
        <ZodType type={(type.indexer ?? type.baseModel!.indexer)!.key} nested />,
        <ZodType type={(type.indexer ?? type.baseModel!.indexer)!.value} nested />,
      ),
    ];
  }

  if (!recordPart || type.properties.size > 0) {
    const membersSpec: Record<string, () => Children> = {};

    for (const member of type.properties.values()) {
      // Check if the member type is unresolved
      if (isUnresolvedSymbol(member.type)) {
        console.log(`Model ${type.name} property ${member.name} has an unresolved symbol due to circular, parent, or namespace references.  Defaulting to z.unknown().`);
        
        // Handle unresolved symbol with a chained describe() method
        const memberComponents = [
          call("unknown"),
          ...(member.optional ? [call("optional")] : []),
          ...defaultBuilder(member),
          ...docBuilder(member),
          // Add an additional describe() to mention the unresolved symbol
          call("describe", "\"This model has an unresolved symbol due to circular, parent, or namespace references.  Defaulting to z.unknown()\"")
        ];
        
        // Sanitize property name to remove invalid characters like @ and backticks
        const sanitizedName = sanitizePropertyName(member.name);
        
        membersSpec[sanitizedName] = () => {
          return <ZodExpression>{memberComponents}</ZodExpression>;
        };
        continue;
      }

      const memberComponents = [
        shouldReference(member.type) ? refkey(member.type, refkeySym) : typeBuilder(member.type),
        ...($.scalar.extendsString(member.type) ? stringConstraints(member) : []),
        ...($.scalar.extendsNumeric(member.type)
          ? numericConstraints(member, undefined, undefined)
          : []),
        ...($.array.is(member.type) ? arrayConstraints(member) : []),
        ...(member.optional ? [call("optional")] : []),
        ...defaultBuilder(member),
        ...docBuilder(member),
      ];

      // Sanitize property name to remove invalid characters like @ and backticks
      const sanitizedName = sanitizePropertyName(member.name);

      membersSpec[sanitizedName] = () => {
        if (shouldReference(member.type)) {
          return <MemberChainExpression>{memberComponents}</MemberChainExpression>;
        }

        return <ZodExpression>{memberComponents}</ZodExpression>;
      };
    }
    objectPart = [call("object", [<ObjectExpression jsValue={membersSpec} />])];
  }

  if (recordPart && objectPart) {
    components = [
      call(
        "intersection",
        <ZodExpression>{objectPart}</ZodExpression>,
        <ZodExpression>{recordPart}</ZodExpression>,
      ),
    ];
  } else {
    components = objectPart ?? recordPart ?? [];
  }

  if (type.baseModel && (!isRecord(type.baseModel) || isDeclaration(type.baseModel))) {
    if (isDeclaration(type.baseModel)) {
      const nestedComponents = components;
      components = [
        refkey(type.baseModel, refkeySym),
        call("merge", <ZodExpression>{nestedComponents}</ZodExpression>),
      ];
    } else {
      components.push(...modelBuilder(type.baseModel));
    }
  }

  components.push(...docBuilder(type));

  return components;
}

// Helper function to build just the object part without base model merging
function objectBuilder(type: Model): Children[] {
  const membersSpec: Record<string, () => Children> = {};
  
  for (const member of type.properties.values()) {
    // Check if the member type is unresolved
    if (isUnresolvedSymbol(member.type)) {
      console.log(`Model ${type.name} property ${member.name} has an unresolved symbol due to circular, parent, or namespace references. Defaulting to z.unknown().`);
      
      // Handle unresolved symbol with a chained describe() method
      const memberComponents = [
        call("unknown"),
        ...(member.optional ? [call("optional")] : []),
        ...defaultBuilder(member),
        ...docBuilder(member),
        call("describe", "\"This model has an unresolved symbol due to circular, parent, or namespace references. Defaulting to z.unknown()\"")
      ];
      
      // Sanitize property name
      const sanitizedName = sanitizePropertyName(member.name);
      
      membersSpec[sanitizedName] = () => {
        return <ZodExpression>{memberComponents}</ZodExpression>;
      };
      continue;
    }
    
    // ...existing property handling code...
    const memberComponents = [
      shouldReference(member.type) ? refkey(member.type, refkeySym) : typeBuilder(member.type),
      ...($.scalar.extendsString(member.type) ? stringConstraints(member) : []),
      ...($.scalar.extendsNumeric(member.type)
        ? numericConstraints(member, undefined, undefined)
        : []),
      ...($.array.is(member.type) ? arrayConstraints(member) : []),
      ...(member.optional ? [call("optional")] : []),
      ...defaultBuilder(member),
      ...docBuilder(member),
    ];

    // Sanitize property name
    const sanitizedName = sanitizePropertyName(member.name);

    membersSpec[sanitizedName] = () => {
      if (shouldReference(member.type)) {
        return <MemberChainExpression>{memberComponents}</MemberChainExpression>;
      }
      return <ZodExpression>{memberComponents}</ZodExpression>;
    };
  }
  
  return [
    call("object", [<ObjectExpression jsValue={membersSpec} />]),
    ...docBuilder(type)
  ];
}

function defaultBuilder(prop: ModelProperty) {
  if (!prop.defaultValue) {
    return [];
  }

  return [call("default", <TSValueExpression value={prop.defaultValue} />)];
}
