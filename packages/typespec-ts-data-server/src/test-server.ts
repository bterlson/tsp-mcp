import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
const app = new Hono();

const querySchema = z
  .object({
    name: z.string().optional(),
  })
  .optional();

app.get("/", zValidator("query", querySchema), (c) => {
  const name = c.req.valid("query")?.name;
  return c.text(`Hello ${name ?? "World"}!`);
});

serve(app);
export default app;
