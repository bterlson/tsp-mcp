import { refkey } from "@alloy-js/core";
import { Model, Scalar } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { getKeyProp, resourceName } from "../utils.js";
import { HonoApp } from "../well-known-symbols.js";
import { Coerce } from "./Coerse.jsx";
import { RestResourceCheckHandler } from "./RestResourceCheckHandler.jsx";

export interface RestResourceGetProps {
  type: Model;
}

export function RestResourceGet(props: RestResourceGetProps) {
  const path = "/" + resourceName(props.type) + "/:id";
  const keyProp = getKeyProp(props.type)?.type ?? $.builtin.string;
  return <>
    {HonoApp}.get("{path}", async (c) ={">"} {"{"}
      <RestResourceCheckHandler type={props.type} />

      return c.json(await {refkey(props.type, "handler-value")}.read(<Coerce from={$.builtin.string} to={keyProp as Scalar}>
          c.req.param("id")
      </Coerce>), 200);
    {"}"})
  </>;
}
