import { Children } from "@alloy-js/core/jsx-runtime";
import { $ } from "@typespec/compiler/experimental/typekit";
import { zod } from "../external-packages/zod.js";
import { ZodBigIntConstraints, ZodNumericConstraints, ZodStringConstraints } from "../utils.js";
import { ZodTypeProps } from "./ZodType.jsx";

export function ZodScalarIntrinsic(props: ZodTypeProps): Children {
  // IMPORTANT:  Please note that all scalar handlers in this method must be organized from most narrow
  // to least narrow. This is because the scalar handlers are not mutually exclusive due to use of .extendsXXX(),
  // and the first one that matches will be used, causing incorrect bit-limitation constraints to be applied
  // (or skipped altogether).

  let optString = "";
  if (props.constraints?.itemOptional) {
    optString = ".optional()";
  }

  // In TypeSpec, null is an intrinsic type (typically used in a union) rather than a qualifier on a type,
  // like the decorator "@optional".  This means it's easier for us to emit the Zod version as z.null() instead of
  // appending .nullable to the z.union() (etc.) element; the alternative would be to add a special case inside the union
  // handlng code -- specifically in the ay.mapJoin() sub-call in the ZodType() function where we'd have to
  // ignore the null type when emitting the union but keep track of having seen it so we can append .nullable() to the
  // Not worth it, since the current way still creates legal Zod code without any special casing.
  if (props.type.kind === "Intrinsic" && props.type.name === "null") {
    return (
      <>
        {zod.z}.null(){optString}
      </>
    );
  }

  if ($.scalar.is(props.type)) {
    // Types with parity in Zod
    if ($.scalar.extendsBoolean(props.type)) {
      return (
        <>
          {zod.z}.boolean(){optString}
        </>
      );
    }

    if ($.scalar.extendsBytes(props.type)) {
      return (
        <>
          {zod.z}.string(){optString}
        </>
      );
    }

    // Numbers
    // Bit limitations don't translate very well for floats, since they really
    // affect precision and not min/max values (i.e. a mismatch won't
    // cause an overflow but just a truncation in accuracy).  We will leave these as
    // numbers.
    if ($.scalar.extendsFloat(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsFloat32(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsFloat64(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    // With integers, though, we completely understand the range and can parse to it.
    if ($.scalar.extendsInt8(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, -128, 127)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInt16(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, -32768, 32767)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInt32(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, -2147483648, 2147483647)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsSafeint(props.type)) {
      return (
        <>
          {zod.z}.number().safe(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInt64(props.type)) {
      return (
        <>
          {zod.z}.bigint(){ZodBigIntConstraints(props, -9223372036854775808n, 9223372036854775807n)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint8(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative(){ZodNumericConstraints(props, undefined, 255)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint16(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative(){ZodNumericConstraints(props, undefined, 65535)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint32(props.type)) {
      return (
        <>
          {zod.z}.number().nonnegative(){ZodNumericConstraints(props, undefined, 4294967295)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsUint64(props.type)) {
      return (
        <>
          {zod.z}.bigint().nonnegative()
          {ZodBigIntConstraints(props, undefined, 18446744073709551615n)}
          {optString}
        </>
      );
    }
    if ($.scalar.extendsInteger(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    if ($.scalar.extendsUrl(props.type)) {
      return (
        <>
          {zod.z}.string().url(){optString}
        </>
      );
    }

    if ($.scalar.extendsString(props.type)) {
      return (
        <>
          {zod.z}.string(){ZodStringConstraints(props)}
          {optString}
        </>
      );
    }

    if ($.scalar.extendsDecimal(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    // isDecimal128 is problematic.  If intended to be a whole number (integer), it must be less than 2^53-1 and thus
    // can't be represented as a number in JavaScript without using BigInt.  But BigInt
    // makes no sense if this is a floating point number.  We will leave this as a number.
    // Since Decimal128 is a 128-bit floating point number, we'll take the hit in
    // precision if an integer.
    if ($.scalar.extendsDecimal128(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    if ($.scalar.extendsNumeric(props.type)) {
      return (
        <>
          {zod.z}.number(){ZodNumericConstraints(props, undefined, undefined)}
          {optString}
        </>
      );
    }

    //Dates and times
    if ($.scalar.extendsOffsetDateTime(props.type)) {
      const encoding = $.scalar.getEncoding(props.type);
      if (encoding?.encoding === "unixTimestamp") {
        return (
          <>
            {zod.z}.number().int(){optString}
          </>
        );
      }
      return (
        <>
          {zod.z}.string().datetime(&#123;offset: true&#125;){optString}
        </>
      );
    }
    if ($.scalar.extendsUtcDateTime(props.type)) {
      const encoding = $.scalar.getEncoding(props.type);
      if (encoding?.encoding === "unixTimestamp") {
        return (
          <>
            {zod.z}.number().int(){optString}
          </>
        );
      }
      return (
        <>
          {zod.z}.string().datetime(){optString}
        </>
      );
    }
    if ($.scalar.extendsDuration(props.type)) {
      return (
        <>
          {zod.z}.string().duration(){optString}
        </>
      );
    }
    if ($.scalar.extendsPlainDate(props.type)) {
      return (
        <>
          {zod.z}.string().date(){optString}
        </>
      );
    }
    if ($.scalar.extendsPlainTime(props.type)) {
      return (
        <>
          {zod.z}.string().time(){optString}
        </>
      );
    }
  }
  return (
    <>
      {zod.z}.any(){optString}
    </>
  );
}
