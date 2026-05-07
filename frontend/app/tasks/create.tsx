import { useRouter } from 'expo-router';

import { TaskForm } from '../../src/features/tasks/components/task-form';
import { TaskScreenShell } from '../../src/features/tasks/components/task-screen-shell';
import { useCreateTask } from '../../src/features/tasks/hooks/use-tasks';
import { buildCreateTaskPayload } from '../../src/features/tasks/utils/task-form';

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTaskMutation = useCreateTask();
  const goBackToTasks = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/tasks');
  };

  return (
    <TaskScreenShell
      description="Capture a new task with a clear title, optional due date, and just enough context for later."
      onBackPress={goBackToTasks}
      title="Create task"
    >
      <TaskForm
        error={createTaskMutation.error}
        isSubmitting={createTaskMutation.isPending}
        onCancel={goBackToTasks}
        onSubmit={async (values) => {
          await createTaskMutation.mutateAsync(buildCreateTaskPayload(values));
          router.replace('/(tabs)/tasks');
        }}
        submitLabel="Create Task"
        submittingLabel="Creating..."
      />
    </TaskScreenShell>
  );
}
