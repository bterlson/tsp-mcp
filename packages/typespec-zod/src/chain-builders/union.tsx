import { For } from "@alloy-js/core";
import { ArrayExpression } from "@alloy-js/typescript";
import { getDiscriminatedUnion, ignoreDiagnostics, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { ZodType } from "../components/ZodType.jsx";
import { call } from "../utils.jsx";

export function unionBuilder(type: Union) {
  const discriminated = ignoreDiagnostics(getDiscriminatedUnion($.program, type));

  if ($.union.isExpression(type) || !discriminated) {
    return [
      call(
        "union",
        <ArrayExpression>
          <For each={Array.from(type.variants.values())} comma line>
            {(variant) => <ZodType type={variant.type} nested />}
          </For>
        </ArrayExpression>,
      ),
    ];
  }

  const propKey = discriminated.options.discriminatorPropertyName;
  const envKey = discriminated.options.envelopePropertyName;
  const unionArgs = [
    `"${propKey}"`,
    <ArrayExpression>
      <For each={Array.from(type.variants.values())} comma line>
        {(variant) => {
          if (discriminated.options.envelope === "object") {
            const envelope = $.model.create({
              properties: {
                [propKey]: $.modelProperty.create({
                  name: propKey,
                  type: $.literal.create(variant.name as string),
                }),
                [envKey]: $.modelProperty.create({
                  name: envKey,
                  type: variant.type,
                }),
              },
            });
            return <ZodType type={envelope} nested />;
          } else {
            return <ZodType type={variant.type} nested />;
          }
        }}
      </For>
    </ArrayExpression>,
  ];

  return [call("discriminatedUnion", ...unionArgs)];
}
