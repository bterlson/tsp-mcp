import { Model } from "@typespec/compiler";
import { resourceName } from "../utils.js";
import { HonoApp } from "../well-known-symbols.js";

export interface RestResourceGetProps {
  type: Model;
}

export function RestResourceGet(props: RestResourceGetProps) {
  const path = "/" + resourceName(props.type) + "/:id";
  return <>
    {HonoApp}.get("{path}", (c) ={">"} {"{}"})
  </>;
}
