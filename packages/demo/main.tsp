model TodoItem {
  /** The item's unique id */
  @visibility("read") @key id: safeint;
 
  /** The item's title */
  @maxLength(255)
  title: string;
 
  /** A longer description of the todo item in markdown format */
  description?: string;
 
  /** The status of the todo item */
  status: "NotStarted" | "InProgress" | "Completed";
 
  /** When the todo item was created. */
  @visibility("read") createdAt: utcDateTime;
 
  /** When the todo item was last updated */
  @visibility("read") updatedAt: utcDateTime;
 
  /** When the todo item was marked as completed */
  @visibility("read") completedAt?: utcDateTime;
}