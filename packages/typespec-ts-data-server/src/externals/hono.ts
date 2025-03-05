import { createPackage } from "@alloy-js/typescript";

export const hono = createPackage({
  name: "hono",
  version: "^4.7.2",
  descriptor: {
    ".": {
      named: ["Hono"],
    },
  },
});

export const zValidator = createPackage({
  name: "@hono/zod-validator",
  version: "^0.4.3",
  descriptor: {
    ".": {
      named: ["zValidator"],
    },
  },
});
