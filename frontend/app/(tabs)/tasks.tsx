import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthStatusCard } from '../../src/features/auth/components/auth-status-card';
import {
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from '../../src/features/tasks/hooks/use-tasks';
import { TaskListItemCard } from '../../src/features/tasks/components/task-list-item';
import { getApiErrorMessage } from '../../src/features/auth/utils/api-error';

export default function TasksScreen() {
  const router = useRouter();
  const tasksQuery = useTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const completedCount = useMemo(
    () => tasksQuery.tasks.filter((task) => task.completed).length,
    [tasksQuery.tasks],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={tasksQuery.tasks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          tasksQuery.isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#0f766e" />
              <Text style={styles.stateText}>Loading your tasks...</Text>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Your list is clear</Text>
              <Text style={styles.stateText}>
                Create a task to start testing the full optimistic workflow.
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>Task command center</Text>
              <Text style={styles.title}>Plan, update, and complete tasks without waiting on the network.</Text>
              <Text style={styles.description}>
                This screen is wired to TanStack Query with MMKV-backed cache hydration and optimistic mutations.
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{tasksQuery.tasks.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{completedCount}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <Pressable
                  onPress={() => {
                    router.push('/tasks/create');
                  }}
                  style={({ pressed }) => [
                    styles.createButton,
                    pressed ? styles.pressed : undefined,
                  ]}
                >
                  <Text style={styles.createButtonLabel}>New Task</Text>
                </Pressable>
              </View>
            </View>
            {tasksQuery.isError ? (
              <AuthStatusCard
                tone="error"
                title="Tasks could not refresh"
                description={getApiErrorMessage(
                  tasksQuery.error,
                  'We could not fetch the latest tasks. Cached data may still be visible.',
                )}
              />
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void tasksQuery.refetch();
            }}
            refreshing={tasksQuery.isRefetching}
            tintColor="#0f766e"
          />
        }
        renderItem={({ item }) => {
          const isUpdatingTask =
            updateTaskMutation.isPending && updateTaskMutation.variables?.taskId === item.id;
          const isDeletingTask =
            deleteTaskMutation.isPending && deleteTaskMutation.variables?.taskId === item.id;

          return (
            <TaskListItemCard
              isDeleting={isDeletingTask}
              isUpdating={isUpdatingTask}
              onDelete={() => {
                Alert.alert('Delete task', `Delete "${item.title}"?`, [
                  { style: 'cancel', text: 'Cancel' },
                  {
                    style: 'destructive',
                    text: 'Delete',
                    onPress: () => {
                      deleteTaskMutation.mutate({ taskId: item.id });
                    },
                  },
                ]);
              }}
              onEdit={() => {
                router.push(`/tasks/${item.id}`);
              }}
              onToggleComplete={() => {
                updateTaskMutation.mutate({
                  taskId: item.id,
                  values: {
                    completed: !item.completed,
                  },
                });
              }}
              task={item}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  createButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 118,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  createButtonLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  description: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSection: {
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  listContent: {
    gap: 14,
    padding: 20,
    paddingBottom: 32,
  },
  pressed: {
    opacity: 0.9,
  },
  safeArea: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statPill: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
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
    textAlign: 'center',
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
});
