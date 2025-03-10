import { Children } from "@alloy-js/core/jsx-runtime";
import { FunctionCallExpression } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";

export const refkeySym = Symbol.for("typespec-zod.refkey");

/**
 * Returns true if the given type is a declaration or an instantiation of a
 * declaration.
 */
export function isDeclaration(type: Type): boolean {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Enum":
    case "Operation":
    case "EnumMember":
      // TODO: this should reference the enum member via
      // target.enum.Name
      return false;
    case "UnionVariant":
      return false;

    case "Model":
      if ($.array.is(type) || $.record.is(type)) {
        return false;
      }

      return Boolean(type.name);
    case "Union":
      return Boolean(type.name);
    case "Scalar":
      return true;
    default:
      return false;
  }
}

// typekit doesn't consider things which have properties as records
// even though they are?
export function isRecord(type: Type): boolean {
  return type.kind === "Model" && !!type.indexer && type.indexer.key === $.builtin.string;
}

export function shouldReference(type: Type) {
  return isDeclaration(type) && !isBuiltIn(type);
}

export function isBuiltIn(type: Type) {
  return (type as any).namespace?.name === "TypeSpec";
}
export function createCycleset(types: Type[]) {
  let index = 0; // Unique index assigned to each node
  const stack: Type[] = []; // Stack to maintain the current DFS path
  const indices = new Map<Type, number>(); // Map to store the index for each node
  const lowlink = new Map<Type, number>(); // Map to store the smallest index reachable from each node
  const onStack = new Set<Type>(); // Set to quickly check if a node is on the stack
  const sccs: Type[][] = []; // Array to hold the strongly connected components
  const inputTypes = new Set(types);

  // The main recursive function that implements Tarjan's algorithm.
  function strongConnect(v: Type): void {
    // Set the depth index for v to the smallest unused index
    indices.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    // Consider successors of v
    for (const w of referencedTypes(v)) {
      if (!indices.has(w)) {
        // Successor w has not yet been visited; recurse on it.
        strongConnect(w);
        // After recursion, update lowlink[v]
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        // If w is in the current SCC (i.e. on the stack), update lowlink[v]
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    // If v is a root node, pop the stack and generate an SCC.
    if (lowlink.get(v) === indices.get(v)) {
      const component: Type[] = [];
      let w: Type;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      // Add the SCC to the result. Tarjan's algorithm returns SCCs in reverse topological order.
      const scc = component.filter((v) => inputTypes.has(v));
      if (scc.length > 0) {
        sccs.push(scc);
      }
    }
  }

  // Start the DFS at every node that has not yet been visited.
  for (const node of types) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  // The sccs array is in an order such that for any two SCCs A and B,
  // if A comes before B then no node in A has an edge to any node in B.
  // This satisfies the requirement: nothing in an earlier element references anything in a later element.
  return sccs;

  function referencedTypes(type: Type): Type[] {
    switch (type.kind) {
      case "Model":
        return [
          ...(type.baseModel ? [type.baseModel] : []),
          ...(type.indexer ? [type.indexer.key, type.indexer.value] : []),
          ...[...type.properties.values()].map((p) => p.type),
        ];

      case "Union":
        return [...type.variants.values()].map((v) => (v.kind === "UnionVariant" ? v.type : v));
      case "UnionVariant":
        return [type.type];
      case "Interface":
        return [...type.operations.values()];
      case "Operation":
        return [type.parameters, type.returnType];
      case "Enum":
        return [];
      case "Scalar":
        return type.baseScalar ? [type.baseScalar] : [];
      case "Tuple":
        return type.values;
      case "Namespace":
        return [
          ...type.operations.values(),
          ...type.scalars.values(),
          ...type.models.values(),
          ...type.enums.values(),
          ...type.interfaces.values(),
          ...type.namespaces.values(),
        ];
      default:
        return [];
    }
  }
}

export function call(target: string, ...args: Children[]) {
  return <FunctionCallExpression target={target} args={args} />;
}
