import { mapJoin, Output } from "@alloy-js/core";
import { BarrelFile, SourceFile } from "@alloy-js/typescript";
import { EmitContext, Model, navigateProgram } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { writeOutput } from "@typespec/emitter-framework";
import { zod, ZodTypeDeclaration } from "typespec-zod"; // Updated import
import { McpServerOptions } from "./components/McpServer.js";

export async function $onEmit(context: EmitContext) {
  const models = getAllModels(context);
  const modelDecls = mapJoin(models, (type) => <ZodTypeDeclaration type={type} export />); // Updated component and prop

  // There are two things to emit:
  // 1. The Zod models.  This is already done here by emitting modelDecls.
  writeOutput(
    <Output externals={[zod]}>
      <SourceFile path="zod-types.ts">
        {modelDecls}
      </SourceFile>
      <SourceFile path="mcp-server.ts">
        <McpServer2 models={models} />
      </SourceFile>
      <BarrelFile />
    </Output>,
    context.emitterOutputDir,
  );

  /*
  // 2. The McpServer code, project files like package.json, etc.
  // Extract operations from the program
  const operations = extractOperations(context);

  // Generate MCP server files - these will now be formatted using Alloy
  const serverFiles = generateMcpServerProject({
    operations,
    program: context.program,
    models: models // Pass the models to the server generator
  });

  // Create a nested directory "server" for the MCP server files
  const serverDir = "server";
  
  // Emit each server file using writeOutput
  for (const file of serverFiles) {
    // Prepend the server directory path
    const fullPath = `${serverDir}/${file.path}`;
    
    // Emit the JSX Element directly
    writeOutput(
      <Output>
        <SourceFile path={fullPath}>
          {file.content}
        </SourceFile>
      </Output>,
      context.emitterOutputDir,
    );
  }

  // Also copy the types.ts to the server/src directory
  writeOutput(
    <Output externals={[zod]}>
      <SourceFile path={`${serverDir}/src/types.ts`}>
        {modelDecls}
      </SourceFile>
    </Output>,
    context.emitterOutputDir,
  );

  // Generate demo entry point in demo/src/mcp-server/index.ts
  writeOutput(
    <Output>
      <SourceFile path="../../src/mcp-server/index.ts">
        {`import { startMcpServer } from "../../tsp-output/typespec-mcp/server/src/index.js";

// Start the MCP server
startMcpServer();`}
      </SourceFile>
    </Output>,
    context.emitterOutputDir,
  );
  */
}

// Helper function to extract operations from the TypeSpec program
function extractOperations(context: EmitContext): McpServerOptions["operations"] {
  // Simplified stub implementation - will be enhanced later
  return [
    {
      operationId: "exampleGet",
      path: "/api/example",
      method: "get",
      description: "Example GET operation",
    },
    {
      operationId: "examplePost",
      path: "/api/example",
      method: "post",
      description: "Example POST operation",
    },
  ];
}

function getAllModels(context: EmitContext) {
  const models: Model[] = [];
  navigateProgram(
    context.program,
    {
      model(m) {
        // todo: tighten this up with a typekit?
        if (
          !$.model.isExpresion(m) &&
          m.namespace!.name !== "TypeSpec" &&
          m.namespace!.name !== "Reflection"
        ) {
          models.push(m);
        }
      },
    },
    {},
  );

  return models;
}
