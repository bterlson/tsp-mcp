import { serve } from "@hono/node-server";
import {
  TodoItemCreate,
  TodoItemRead,
  TodoItemUpdate,
  app,
  setTodoItemHandler,
} from "../../tsp-output/typespec-ts-data-server/index.js";

const items: TodoItemRead[] = [];
let currentId = 0;

setTodoItemHandler({
  async list() {
    return {
      status: 200,
      body: items,
    };
  },
  async create(item: TodoItemCreate) {
    const newId = ++currentId;
    const newItem: TodoItemRead = {
      ...item,
      id: newId,
      createdAt: new Date(),
    };

    items.push(newItem);

    return {
      status: 201,
      body: newItem,
    };
  },
  async delete(id: number) {
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        status: 404,
        body: undefined,
      };
    }

    items.splice(index, 1);

    return {
      status: 204,
      body: undefined,
    };
  },
  async read(id: number) {
    const item = items.find((item) => item.id === id);

    if (!item) {
      return {
        status: 404,
        body: { code: "NotFound", message: "Item not found" },
      };
    }

    return {
      status: 200,
      body: item,
    };
  },
  async update(id: number, patch: TodoItemUpdate) {
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        status: 404,
        body: { code: "NotFound", message: "Item not found" },
      };
    }

    // Update item with patch data, keeping existing id and createdAt
    const updatedItem = {
      ...items[index],
      ...patch,
    };

    items[index] = updatedItem;

    return {
      status: 200,
      body: updatedItem,
    };
  },
});

serve(app, () => {
  console.log("REST server is running on http://localhost:3000");
});
