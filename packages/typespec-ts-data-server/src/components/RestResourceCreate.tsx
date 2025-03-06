import { refkey } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { zValidator } from "../externals/hono.js";
import { resourceName } from "../utils.js";
import { HonoApp } from "../well-known-symbols.js";

export interface RestResourceCreateProps {
  type: Model;
}

export function RestResourceCreate(props: RestResourceCreateProps) {
  const path = "/" + resourceName(props.type);
  return <>
    {HonoApp}.post("{path}", {zValidator.zValidator}("json", {refkey(props.type, "zod-schema-create")}), (c) ={">"} {"{}"})
  </>;
}
