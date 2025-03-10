model TodoItem {
  /** The item's unique id */
  @visibility(Lifecycle.Read)
  @key id: safeint;

  /** The item's title */
  title: string;

  /** A longer description of the todo item in markdown format */
  description?: string;

  /** The status of the todo item */
  status: "NotStarted" | "InProgress" | "Completed";

  /** When the todo item was created. */
  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;

  /** When the todo item was marked as completed */
  @visibility(Lifecycle.Read)
  completedAt?: utcDateTime;
}