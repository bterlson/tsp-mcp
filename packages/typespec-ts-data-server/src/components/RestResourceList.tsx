import { Model } from "@typespec/compiler";
import { resourceName } from "../utils.js";
import { HonoApp } from "../well-known-symbols.js";

export interface RestResourceListProps {
  type: Model;
}

export function RestResourceList(props: RestResourceListProps) {
  const path = "/" + resourceName(props.type);
  return <>
    {HonoApp}.get("{path}", (c) ={">"} {"{}"})
  </>;
}
