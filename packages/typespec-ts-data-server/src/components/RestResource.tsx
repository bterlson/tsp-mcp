import { StatementList } from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { RestResourceCreate } from "./RestResourceCreate.jsx";
import { RestResourceDelete } from "./RestResourceDelete.jsx";
import { RestResourceGet } from "./RestResourceGet.jsx";
import { RestResourceList } from "./RestResourceList.jsx";
import { RestResourceUpdate } from "./RestResourceUpdate.jsx";

export interface RestResourceProps {
  type: Model;
}

export function RestResource(props: RestResourceProps) {
  return (
    <StatementList>
      <RestResourceList type={props.type} />
      <RestResourceCreate type={props.type} />
      <RestResourceGet type={props.type} />
      <RestResourceUpdate type={props.type} />
      <RestResourceDelete type={props.type} />
    </StatementList>
  );
}
