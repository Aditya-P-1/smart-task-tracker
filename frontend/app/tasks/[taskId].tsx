import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthSubmitButton } from '../../src/features/auth/components/auth-submit-button';
import { useTasks, useUpdateTask } from '../../src/features/tasks/hooks/use-tasks';
import { TaskForm } from '../../src/features/tasks/components/task-form';
import { TaskScreenShell } from '../../src/features/tasks/components/task-screen-shell';
import { buildUpdateTaskPayload, mapTaskToFormValues } from '../../src/features/tasks/utils/task-form';

export default function EditTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
  const updateTaskMutation = useUpdateTask();
  const tasksQuery = useTasks();
  const { isError, isLoading, refetch, tasks } = tasksQuery;
  const goBackToTasks = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/tasks');
  };

  if (!taskId) {
    return <Redirect href="/(tabs)/tasks" />;
  }

  const task = tasks.find((item) => item.id === taskId);

  return (
    <TaskScreenShell
      description="Adjust the title, notes, due date, or completion state without losing the optimistic feel."
      onBackPress={goBackToTasks}
      title="Edit task"
    >
      {isLoading && !task ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#0f766e" />
          <Text style={styles.stateText}>Loading task details...</Text>
        </View>
      ) : null}
      {!isLoading && isError && !task ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Task details could not load</Text>
          <Text style={styles.stateText}>
            Refresh the task list and try again. Cached task data may be unavailable right now.
          </Text>
          <AuthSubmitButton
            label="Retry"
            onPress={() => {
              void refetch();
            }}
            variant="secondary"
          />
        </View>
      ) : null}
      {!isLoading && !isError && !task ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Task not found</Text>
          <Text style={styles.stateText}>
            The task may have been deleted or this link may be stale.
          </Text>
          <AuthSubmitButton
            label="Back to Tasks"
            onPress={() => {
              router.replace('/(tabs)/tasks');
            }}
            variant="secondary"
          />
        </View>
      ) : null}
      {task ? (
        <TaskForm
          error={updateTaskMutation.error}
          initialValues={mapTaskToFormValues(task)}
          isSubmitting={updateTaskMutation.isPending}
          onCancel={goBackToTasks}
          onSubmit={async (values) => {
            await updateTaskMutation.mutateAsync({
              taskId,
              values: buildUpdateTaskPayload(values),
            });
            router.replace('/(tabs)/tasks');
          }}
          submitLabel="Save Changes"
          submittingLabel="Saving..."
        />
      ) : null}
    </TaskScreenShell>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 24,
  },
  stateText: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stateTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
});
