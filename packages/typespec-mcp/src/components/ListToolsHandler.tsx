import { ObjectExpression } from "@alloy-js/typescript";
import { Model, Type } from "@typespec/compiler";
import { mcp } from "../externals.js";
import { debugLog, getTypeName, typeToToolDescriptors } from "../utils.js";
import { RequestHandler } from "./RequestHandler.jsx";

export interface ListToolsHandlerProps {
  types: Type[];
}

// Helper function to safely get type name
function safeGetTypeName(t: Type | undefined | null): string {
  if (!t) return 'unnamed';
  if (t.kind === 'Model') return (t as Model).name || 'unnamed';
  return 'unnamed';
}

export function ListToolsHandler(props: ListToolsHandlerProps) {
  try {
    // Minimal logging - only log count, not types
    debugLog(`ListToolsHandler with ${props.types?.length || 0} types`);
    
    if (!props.types || !Array.isArray(props.types) || props.types.length === 0) {
      debugLog("ListToolsHandler received invalid types array");
      return null;
    }
    
    const toolDescriptors = props.types
      .map(type => typeToToolDescriptors(type))
      .filter(Boolean);
    
    // Only log count for successful results
    if (toolDescriptors.length > 0) {
      debugLog(`Generated ${toolDescriptors.length} tool descriptors`);
    } else {
      debugLog("No valid tool descriptors were generated");
      return null;
    }
    
    const toolList = {
      tools: toolDescriptors
    };

    return (
      <RequestHandler schema={mcp["./types.js"].ListToolsRequestSchema}>
        return <ObjectExpression jsValue={toolList} />;
      </RequestHandler>
    );
  } catch (error) {
    debugLog(`Error in ListToolsHandler: ${(error as Error).message}`, error);
    return null;
  }
}
