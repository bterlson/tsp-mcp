import { serve } from "@hono/node-server";
import {
  TodoItemRead,
  app,
  setTodoItemHandler,
} from "../../tsp-output/typespec-ts-data-server/index.js";

const items: TodoItemRead[] = [];
let currentId = 0;

setTodoItemHandler({
  async list() {
    return { status: 200, body: items };
  },
  async create(item) {
    const now = new Date(Date.now());
    const newItem: TodoItemRead = {
      ...item,
      id: currentId++,
      createdAt: now,
      updatedAt: now,
    };
    items.push(newItem);

    return { status: 200, body: newItem };
  },
  async delete(id) {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      return { status: 404, body: { code: "not-found", message: "Todo item is not found" } };
    }
    items.splice(index, 1);

    return { status: 200, body: undefined };
  },
  async read(id) {
    const item = items.find((i) => i.id === id);
    if (!item) {
      return { status: 404, body: { code: "not-found", message: "Todo item is not found" } };
    }
    return { status: 200, body: item };
  },
  async update(id, patch) {
    const item = items.find((i) => i.id === id)!;

    if ("title" in patch && patch.title) {
      item.title = patch.title;
    }

    if ("description" in patch && patch.description !== undefined) {
      if (patch.description === null) {
        delete item.description;
      }

      item.description = patch.description;
    }

    if ("status" in patch && patch.status !== undefined) {
      item.status = patch.status;
    }

    item.updatedAt = new Date(Date.now());
    if (item.status === "Completed") {
      item.completedAt = new Date(Date.now());
    }

    return { status: 200, body: item };
  },
});

serve(app);
