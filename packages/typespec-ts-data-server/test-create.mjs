// use fetch to send a post request to localhost:3000 with a JSON post body

const todoItem = {
  title: "Complete TypeSpec tutorial",
  description: "Work through all examples in the documentation",
  status: "InProgress",
};

async function createTodoItem() {
  try {
    const response = await fetch("http://localhost:3000/TodoItems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(todoItem),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Todo item created successfully:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to create todo item:", error);
  }
}

createTodoItem();
