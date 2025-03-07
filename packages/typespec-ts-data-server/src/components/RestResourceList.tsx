import { Block, refkey } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { resourceName } from "../utils.js";
import { HonoApp } from "../well-known-symbols.js";
import { RestResourceCheckHandler } from "./RestResourceCheckHandler.jsx";

export interface RestResourceListProps {
  type: Model;
}

export function RestResourceList(props: RestResourceListProps) {
  const path = "/" + resourceName(props.type);
  return (
    <>
      {HonoApp}.get("{path}", async (c) ={"> "}
      <Block>
        <RestResourceCheckHandler type={props.type} />
        <hbr />
        <hbr />
        return c.json(await {refkey(props.type, "handler-value")}.list(), 200);
      </Block>
      )
    </>
  );
}
