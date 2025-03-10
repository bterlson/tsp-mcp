import { Block, BlockProps, Scope, ScopeProps } from "@alloy-js/core";

// This component will be provided by Alloy

export interface BlockScopeProps extends BlockProps, ScopeProps {}

export function BlockScope(props: BlockScopeProps) {
  return (
    <Block {...props}>
      <Scope {...props}>{props.children}</Scope>
    </Block>
  );
}
