import { Block, code, For, List, refkey, Scope, StatementList } from "@alloy-js/core";
import { FunctionCallExpression, VarDeclaration } from "@alloy-js/typescript";
import { Model, Type } from "@typespec/compiler";
import { mcp } from "../externals.js";
import { keyName, resourceName, toolNameForType } from "../utils.js";
import { FetchCall } from "./FetchCall.jsx";
import { JsonToolCallResponse } from "./JsonToolCallResponse.jsx";
import { RequestHandler } from "./RequestHandler.jsx";

export interface CallToolHandlerProps {
  types: Type[];
}

export function CallToolHandler(props: CallToolHandlerProps) {
  return (
    <RequestHandler schema={mcp["./types.js"].CallToolRequestSchema}>
      switch (request.params.name){" "}
      <Block>
        <For each={props.types}>
          {(type) => (
            <List hardline>
              <>
                case "{toolNameForType(type, "list")}":
                <Block>
                  <Scope>
                    <StatementList>
                      <VarDeclaration name="response">
                        await <FetchCall urlString={resourceName(type)} method="GET" />
                      </VarDeclaration>
                      <>if (!response.ok) throw new Error("HTTP Error: " + response.status)</>
                      <VarDeclaration name="data">await response.json()</VarDeclaration>
                      <>
                        return <JsonToolCallResponse data={"data"} />
                      </>
                    </StatementList>
                  </Scope>
                </Block>
              </>
              <>
                case "{toolNameForType(type, "get")}":
                <Block>
                  <Scope>
                    <StatementList>
                      <>
                        const {"{"} {keyName(type as Model)}
                        {"}"} ={" "}
                        <FunctionCallExpression
                          target={<>{refkey(type, "zod-schema-get")}.parse</>}
                          args={["request.params.arguments"]}
                        />
                      </>
                      <VarDeclaration name="response">
                        await{" "}
                        <FetchCall
                          url={
                            <>
                              "{resourceName(type)}/" + {keyName(type as Model)}
                            </>
                          }
                          method="GET"
                        />
                      </VarDeclaration>
                      <>if (!response.ok) throw new Error("HTTP Error: " + response.status)</>
                      <VarDeclaration name="data">await response.json()</VarDeclaration>
                      <>
                        return <JsonToolCallResponse data={"data"} />
                      </>
                    </StatementList>
                  </Scope>
                </Block>
              </>
              <>
                case "{toolNameForType(type, "create")}":
                <Block>
                  <Scope>
                    <StatementList>
                      <>
                        const args ={" "}
                        <FunctionCallExpression
                          target={<>{refkey(type, "zod-schema-create")}.parse</>}
                          args={["request.params.arguments"]}
                        />
                      </>
                      <VarDeclaration name="response">
                        await{" "}
                        <FetchCall urlString={resourceName(type)} method="POST" body={"args"} />
                      </VarDeclaration>
                      <>if (!response.ok) throw new Error("HTTP Error: " + response.status)</>
                      <VarDeclaration name="data">await response.json()</VarDeclaration>
                      <>
                        return <JsonToolCallResponse data={"data"} />
                      </>
                    </StatementList>
                  </Scope>
                </Block>
              </>
              <>
                case "{toolNameForType(type, "update")}":
                <Block>
                  <Scope>
                    <StatementList>
                      <>
                        const {"{"} {keyName(type as Model)}, ... args {"}"} ={" "}
                        <FunctionCallExpression
                          target={<>{refkey(type, "zod-schema-update")}.parse</>}
                          args={["request.params.arguments"]}
                        />
                      </>
                      <VarDeclaration name="response">
                        await{" "}
                        <FetchCall
                          url={
                            <>
                              "{resourceName(type)}/" + {keyName(type as Model)}
                            </>
                          }
                          method="PATCH"
                          body="args"
                        />
                      </VarDeclaration>
                      <>if (!response.ok) throw new Error("HTTP Error: " + response.status)</>
                      <VarDeclaration name="data">await response.json()</VarDeclaration>
                      <>
                        return <JsonToolCallResponse data={"data"} />
                      </>
                    </StatementList>
                  </Scope>
                </Block>
              </>
              <>
                case "{toolNameForType(type, "delete")}":
                <Block>
                  <Scope>
                    <StatementList>
                      <>
                        const {"{"} {keyName(type as Model)}
                        {"}"} ={" "}
                        <FunctionCallExpression
                          target={<>{refkey(type, "zod-schema-get")}.parse</>}
                          args={["request.params.arguments"]}
                        />
                      </>
                      <VarDeclaration name="response">
                        await{" "}
                        <FetchCall
                          url={
                            <>
                              "{resourceName(type)}/" + {keyName(type as Model)}
                            </>
                          }
                          method="DELETE"
                        />
                      </VarDeclaration>
                      <>if (!response.ok) throw new Error("HTTP Error: " + response.status)</>
                      <VarDeclaration name="data">
                        {"{"}deleted: true{"}"}
                      </VarDeclaration>
                      <>
                        return <JsonToolCallResponse data={"data"} />
                      </>
                    </StatementList>
                  </Scope>
                </Block>
              </>
            </List>
          )}
        </For>
      </Block>
      <hbr />
      <hbr />
      {code`
        return {
          content: [
            {
              type: "text",
              text: "Tool not found",
            }
          ],
        };
      `}
    </RequestHandler>
  );
}
