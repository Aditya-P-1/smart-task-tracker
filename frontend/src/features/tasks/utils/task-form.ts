import type {
  CreateTaskPayload,
  Task,
  TaskFormValues,
  TaskListItem,
  UpdateTaskPayload,
} from '../types/task';

export const DEFAULT_TASK_FORM_VALUES: TaskFormValues = {
  completed: false,
  description: '',
  dueDate: '',
  title: '',
};

function normalizeDateInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return new Date(trimmedValue).toISOString();
}

export function isValidTaskDueDate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return true;
  }

  return !Number.isNaN(new Date(trimmedValue).getTime());
}

export function buildCreateTaskPayload(values: TaskFormValues): CreateTaskPayload {
  return {
    completed: values.completed,
    description: values.description.trim(),
    dueDate: normalizeDateInput(values.dueDate),
    title: values.title.trim(),
  };
}

export function buildUpdateTaskPayload(values: TaskFormValues): UpdateTaskPayload {
  return {
    completed: values.completed,
    description: values.description.trim(),
    dueDate: normalizeDateInput(values.dueDate),
    title: values.title.trim(),
  };
}

export function mapTaskToFormValues(task: Task | TaskListItem): TaskFormValues {
  return {
    completed: task.completed,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    title: task.title,
  };
}

export function formatTaskDueDate(value: string | null) {
  if (!value) {
    return 'No due date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
