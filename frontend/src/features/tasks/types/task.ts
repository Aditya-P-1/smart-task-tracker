export type Task = {
  completed: boolean;
  createdAt: string;
  description: string;
  dueDate: string | null;
  id: string;
  title: string;
  updatedAt: string;
  userId: string;
};

export type TaskListItem = Task & {
  isPending?: boolean;
};

export type CreateTaskPayload = {
  completed?: boolean;
  description?: string;
  dueDate?: string | null;
  title: string;
};

export type UpdateTaskPayload = {
  completed?: boolean;
  description?: string;
  dueDate?: string | null;
  title?: string;
};

export type UpdateTaskInput = {
  taskId: string;
  values: UpdateTaskPayload;
};

export type DeleteTaskInput = {
  taskId: string;
};

export type RestoreDeletedTaskContext = {
  deletedTask: TaskListItem;
  userId: string;
};

export type TaskFormValues = {
  completed: boolean;
  description: string;
  dueDate: string;
  title: string;
};

export type CachedTaskList = {
  tasks: Task[];
  updatedAt: string;
  userId: string;
};
