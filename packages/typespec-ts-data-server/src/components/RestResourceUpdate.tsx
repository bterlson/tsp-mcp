import { refkey } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { zValidator } from "../externals/hono.js";
import { resourceName } from "../utils.js";
import { HonoApp } from "../well-known-symbols.js";

export interface RestResourceUpdateProps {
  type: Model;
}

export function RestResourceUpdate(props: RestResourceUpdateProps) {
  const path = "/" + resourceName(props.type) + "/:id";
  return <>
    {HonoApp}.patch("{path}", {zValidator.zValidator}("json", {refkey(props.type, "zod-schema-update")}), (c) ={">"} {"{}"})
  </>;
}
