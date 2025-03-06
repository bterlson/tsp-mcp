import { Model } from "@typespec/compiler";
import { RestResourceCreate } from "./RestResourceCreate.jsx";
import { RestResourceGet } from "./RestResourceGet.jsx";
import { RestResourceList } from "./RestResourceList.jsx";
import { RestResourceUpdate } from "./RestResourceUpdate.jsx";

export interface RestResourceProps {
  type: Model;
}

export function RestResource(props: RestResourceProps) {
  return <>
    <RestResourceList type={props.type} />
    <RestResourceCreate type={props.type} />
    <RestResourceGet type={props.type} />
    <RestResourceUpdate type={props.type} />
  </>;
}
