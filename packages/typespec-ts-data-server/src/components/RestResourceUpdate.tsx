import { refkey } from "@alloy-js/core";
import { Model, Scalar } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { zValidator } from "../externals/hono.js";
import { getKeyProp, resourceName } from "../utils.js";
import { HonoApp } from "../well-known-symbols.js";
import { Coerce } from "./Coerse.jsx";
import { RestResourceCheckHandler } from "./RestResourceCheckHandler.jsx";

export interface RestResourceUpdateProps {
  type: Model;
}

export function RestResourceUpdate(props: RestResourceUpdateProps) {
  const path = "/" + resourceName(props.type) + "/:id";
  const keyProp = getKeyProp(props.type)?.type ?? $.builtin.string;

  return <>
    {HonoApp}.patch("{path}", {zValidator.zValidator}("json", {refkey(props.type, "zod-schema-update")}), async (c) ={">"} {"{"}
      <RestResourceCheckHandler type={props.type} />

      return c.json(await {refkey(props.type, "handler-value")}.update(<Coerce from={$.builtin.string} to={keyProp as Scalar}>
          c.req.param("id")
      </Coerce>, c.req.valid("json")), 200);
    {"}"})
  </>;
}
