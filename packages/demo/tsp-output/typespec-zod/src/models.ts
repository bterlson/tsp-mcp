import { z } from "zod";

export const foo = z.object({
  x: z.string(),
  y: z.string(),
});
