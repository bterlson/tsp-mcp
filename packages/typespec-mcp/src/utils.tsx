import { refkey } from "@alloy-js/core";
import { FunctionCallExpression } from "@alloy-js/typescript";
import {
  $withOptionalProperties,
  $withVisibilityFilter,
  getLifecycleVisibilityEnum,
  isKey,
  Model,
  ModelProperty,
  Type,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { capitalCase, snakeCase } from "change-case";
import pluralize from "pluralize";
import { zod } from "typespec-zod";
import { zodToJsonSchema } from "./externals.js";
import fs from "fs";
import path from "path";

// Minimalist debug logging function to reduce output volume
export function debugLog(message: string, ...objects: any[]) {
  // Only log critical errors or explicit debug calls to console
  if (message.includes("Error") || message.includes("error")) {
    console.error(`[ERROR] ${message}`);
    
    // For errors, log a simplified version of the objects
    if (objects.length > 0) {
      const simplifiedObjects = objects.map(obj => {
        if (obj instanceof Error) {
          return `${obj.name}: ${obj.message}`;
        }
        if (typeof obj === 'object' && obj !== null) {
          return '[Object]';
        }
        return String(obj);
      });
      console.error('Details:', ...simplifiedObjects);
    }
  }
  
  // For file logging, be more selective and limit data size
  try {
    // Only log if DEBUG environment variable is set
    if (process.env.DEBUG_TYPESPEC_MCP) {
      const logPath = path.join(process.cwd(), 'typespec-debug.log');
      const timestamp = new Date().toISOString();
      
      // Limit the number of objects we log and their depth
      const MAX_OBJECTS = 2;
      const MAX_DEPTH = 1;
      
      let objectsToLog = '';
      if (objects.length > 0) {
        const limitedObjects = objects.slice(0, MAX_OBJECTS);
        objectsToLog = limitedObjects.map(obj => {
          if (typeof obj !== 'object' || obj === null) {
            return String(obj);
          }
          
          try {
            // Create a simplified object representation with limited depth
            function simplifyObject(value: any, depth: number): any {
              if (depth > MAX_DEPTH) return '[Nested Object]';
              if (typeof value !== 'object' || value === null) return value;
              
              // For arrays, limit items
              if (Array.isArray(value)) {
                return value.length > 3 ? 
                  `[Array(${value.length}) ${JSON.stringify(value.slice(0, 3))}...]` : 
                  value.map(item => simplifyObject(item, depth + 1));
              }
              
              // For TypeSpec models, extract minimal information
              if (value.kind === 'Model') {
                return {
                  kind: value.kind,
                  name: value.name,
                  propertiesCount: value.properties ? value.properties.size : 0
                };
              }
              
              // For other objects, extract minimal properties
              const result: Record<string, any> = {};
              const keys = Object.keys(value).slice(0, 5); // Limit to 5 keys max
              for (const key of keys) {
                result[key] = simplifyObject(value[key], depth + 1);
              }
              
              if (Object.keys(value).length > 5) {
                result['...'] = `(${Object.keys(value).length - 5} more properties)`;
              }
              
              return result;
            }
            
            return JSON.stringify(simplifyObject(obj, 0), null, 1);
          } catch (err) {
            return '[Unstringifiable Object]';
          }
        }).join('\n');
      }
      
      // Write minimal log entry
      fs.appendFileSync(
        logPath, 
        `[${timestamp}] ${message}\n${objectsToLog}\n\n`
      );
    }
  } catch (error) {
    // Don't let logging errors cause more problems
    console.error("Logging error:", (error as Error).message);
  }
}

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

// Helper function to extract name safely from any type
export function getTypeName(type: Type): string | undefined {
  if (type.kind === "Model") return (type as Model).name;
  if (type.kind === "Interface") return (type as any).name;
  if (type.kind === "Enum") return (type as any).name;
  if (type.kind === "Namespace") return (type as any).name;
  return undefined;
}

// Helper function to extract description from model decorators
function getDescriptionFromModel(model: Model): string | undefined {
  if (!model.decorators) return undefined;
  
  for (const decorator of model.decorators) {
    if (decorator.decorator.name === "doc") {
      const args = decorator.args;
      if (args && args.length > 0 && typeof args[0] === 'string') {
        return args[0];
      }
    }
  }
  
  return undefined;
}

// Helper function to extract description from any type
function getDescriptionFromType(type: Type): string | undefined {
  if (type.kind === "Model") return getDescriptionFromModel(type as Model);
  // Add more type-specific extractors if needed
  return undefined;
}

// Implement typeToToolDescriptors function with minimal logging
export function typeToToolDescriptors(type: Type | null | undefined) {
  if (!type) {
    return null;
  }
  
  try {
    // Only log errors, not routine processing
    if (!type.kind) {
      debugLog(`Type has no kind property`);
      return null;
    }
    
    // For model types
    if (type.kind === "Model") {
      const model = type as Model;
      
      // Extract properties information
      const properties: Record<string, any> = {};
      if (model.properties) {
        for (const [name, prop] of model.properties.entries()) {
          properties[name] = {
            type: prop.type?.kind || 'unknown',
            optional: prop.optional || false
          };
        }
      }
      
      return {
        kind: "tool",
        name: model.name || "UnnamedTool",
        description: getDescriptionFromModel(model) || `Tool for ${model.name}`,
        properties
      };
    }
    
    // For other types, return a simple descriptor
    return {
      kind: "tool",
      name: getTypeName(type) || "UnnamedTool",
      description: getDescriptionFromType(type) || `Tool for ${type.kind}`,
      type: type.kind
    };
  } catch (error) {
    debugLog(`Error in typeToToolDescriptors: ${(error as Error).message}`, error);
    return null;
  }
}

// Enhanced modelWithVisibility with minimal logging
export function modelWithVisibility(
  type: Model,
  visibility: "Create" | "Read" | "Update" | "Delete" | "Query",
) {
  if (!type) {
    debugLog("modelWithVisibility: model is null or undefined");
    const emptyModel = $.model.create({
      name: `Empty${visibility}`,
      properties: {}
    });
    return emptyModel;
  }
  
  const clone = $.type.clone(type);
  try {
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
  } catch (error) {
    debugLog(`Error in modelWithVisibility: ${(error as Error).message}`, error);
    // Fallback to simpler implementation
    const result = $.model.create({
      name: type.name + visibility,
      properties: {}
    });
    
    if (type.properties) {
      for (const [name, prop] of type.properties) {
        // Skip key properties for Create, include them for Update
        if (visibility === "Create") {
          const decorators = prop.decorators || [];
          const isKeyProp = decorators.some(dec => dec.decorator.name === "key");
          const isIdProp = name === "id";
          
          if (!isKeyProp && !isIdProp) {
            result.properties.set(name, prop);
          }
        } else {
          result.properties.set(name, prop);
        }
      }
    }
    
    return result;
  }
}

// Centralized list of error model names
export const ERROR_MODEL_NAMES = ["Error", "ResourceError", "InnerError", "ErrorResponse"];

// Centralized error model detection function
export function isErrorModel(model: Model | null | undefined): boolean {
  if (!model) return false;
  
  // Check by name
  if (ERROR_MODEL_NAMES.includes(model.name)) {
    return true;
  }
  
  // Check if model extends Error
  if (model.baseModel?.name === "Error") {
    return true;
  }
  
  // Check by decorator
  if (model.decorators?.some(d => d.decorator.name === "error")) {
    return true;
  }
  
  return false;
}

// Improved getKeyProp function with error model awareness
export function getKeyProp(model: Model | null | undefined): ModelProperty | null {
  if (!model) {
    debugLog("getKeyProp: model is null or undefined");
    return null;
  }
  
  // Skip key property detection for error models
  if (isErrorModel(model)) {
    // Return null silently for error models
    return null;
  }
  
  // Only log when no properties found - an actual problem
  if (!model.properties || model.properties.size === 0) {
    debugLog(`getKeyProp: model ${model.name} has no properties`);
    return null;
  }
  
  let result: ModelProperty | null = null;
  
  // Look for an @key property
  for (const [_, prop] of model.properties) {
    const decorators = prop.decorators || [];
    for (const decorator of decorators) {
      if (decorator.decorator.name === "key") {
        result = prop;
        break;
      }
    }
    if (result) break;
  }
  
  // If no @key property, look for "id" property
  if (!result) {
    result = model.properties.get("id") || null;
  }
  
  // If no result yet, use first property as fallback
  if (!result && model.properties.size > 0) {
    // Only log for non-error models
    debugLog(`getKeyProp: No key property found for model ${model.name}, using fallback`);
    const firstProp = model.properties.values().next().value;
    result = firstProp || null;
  }
  
  return result;
}

export function keyName(type: Type) {
  if (!$.model.is(type)) {
    debugLog(`Error in keyName: Can only get keys for models, but received ${type?.kind || 'unknown type'}`);
    // Return a fallback key name
    return "id";
  }

  const model = type as Model;
  
  // Handle error models separately with silent fallback
  if (isErrorModel(model)) {
    return "id"; // Silent fallback for error models
  }

  const keyProp = getKeyProp(model);
  if (!keyProp) {
    debugLog(`Error in keyName: No key property found for model ${model.name}`);
    // Return a fallback key name
    return "id";
  }
  return keyProp.name;
}
