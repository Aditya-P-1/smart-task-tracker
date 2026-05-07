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
import { HabitListItemCard } from '../../src/features/habits/components/habit-list-item';
import {
  useCheckInHabit,
  useDeleteHabit,
  useHabits,
} from '../../src/features/habits/hooks/use-habits';
import { getApiErrorMessage } from '../../src/features/auth/utils/api-error';

export default function HabitsScreen() {
  const router = useRouter();
  const habitsQuery = useHabits();
  const checkInHabitMutation = useCheckInHabit();
  const deleteHabitMutation = useDeleteHabit();

  const completedTodayCount = useMemo(
    () => habitsQuery.habits.filter((habit) => habit.completedToday).length,
    [habitsQuery.habits],
  );
  const bestStreak = useMemo(
    () => habitsQuery.habits.reduce((currentMax, habit) => Math.max(currentMax, habit.streak), 0),
    [habitsQuery.habits],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={habitsQuery.habits}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          habitsQuery.isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#0f766e" />
              <Text style={styles.stateText}>Loading your habits...</Text>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Start your first streak</Text>
              <Text style={styles.stateText}>
                Create a habit to test the daily check-in flow and streak updates.
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>Habit engine</Text>
              <Text style={styles.title}>Keep streaks alive with instant daily check-ins.</Text>
              <Text style={styles.description}>
                This screen uses TanStack Query with MMKV-backed cache hydration and optimistic streak updates.
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{habitsQuery.habits.length}</Text>
                  <Text style={styles.statLabel}>Habits</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{completedTodayCount}</Text>
                  <Text style={styles.statLabel}>Done today</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{bestStreak}</Text>
                  <Text style={styles.statLabel}>Best streak</Text>
                </View>
                <Pressable
                  onPress={() => {
                    router.push('/habits/create');
                  }}
                  style={({ pressed }) => [
                    styles.createButton,
                    pressed ? styles.pressed : undefined,
                  ]}
                >
                  <Text style={styles.createButtonLabel}>New Habit</Text>
                </Pressable>
              </View>
            </View>
            {habitsQuery.isError ? (
              <AuthStatusCard
                tone="error"
                title="Habits could not refresh"
                description={getApiErrorMessage(
                  habitsQuery.error,
                  'We could not fetch the latest habits. Cached habits may still be visible.',
                )}
              />
            ) : null}
            {checkInHabitMutation.isError ? (
              <AuthStatusCard
                tone="error"
                title="Check-in could not be saved"
                description={getApiErrorMessage(
                  checkInHabitMutation.error,
                  'We could not save that check-in. Your habit list has been rolled back.',
                )}
              />
            ) : null}
            {deleteHabitMutation.isError ? (
              <AuthStatusCard
                tone="error"
                title="Habit could not be deleted"
                description={getApiErrorMessage(
                  deleteHabitMutation.error,
                  'We could not delete that habit. Your list has been rolled back.',
                )}
              />
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void habitsQuery.refetch();
            }}
            refreshing={habitsQuery.isRefetching}
            tintColor="#0f766e"
          />
        }
        renderItem={({ item }) => {
          const isCheckingIn =
            checkInHabitMutation.isPending &&
            checkInHabitMutation.variables?.habitId === item.id;
          const isDeleting =
            deleteHabitMutation.isPending &&
            deleteHabitMutation.variables?.habitId === item.id;

          return (
            <HabitListItemCard
              habit={item}
              isDeleting={isDeleting}
              isCheckingIn={isCheckingIn}
              onDelete={() => {
                Alert.alert('Delete habit', `Delete "${item.title}"?`, [
                  { style: 'cancel', text: 'Cancel' },
                  {
                    style: 'destructive',
                    text: 'Delete',
                    onPress: () => {
                      deleteHabitMutation.mutate({
                        habitId: item.id,
                      });
                    },
                  },
                ]);
              }}
              onCheckIn={() => {
                checkInHabitMutation.mutate({
                  habitId: item.id,
                });
              }}
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
