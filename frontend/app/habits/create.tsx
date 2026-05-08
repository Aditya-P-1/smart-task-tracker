import { useRouter } from 'expo-router';

import { getNetworkSnapshot, refreshNetworkSnapshot } from '../../src/offline/network/network-service';
import { TaskScreenShell } from '../../src/features/tasks/components/task-screen-shell';
import { HabitForm } from '../../src/features/habits/components/habit-form';
import { useCreateHabit } from '../../src/features/habits/hooks/use-habits';
import { buildCreateHabitPayload } from '../../src/features/habits/utils/habit';

export default function CreateHabitScreen() {
  const router = useRouter();
  const createHabitMutation = useCreateHabit();
  const goBackToHabits = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/habits');
  };

  async function shouldSubmitOfflineFirst() {
    try {
      const snapshot = await refreshNetworkSnapshot();
      return !snapshot.isOnline;
    } catch {
      return !getNetworkSnapshot().isOnline;
    }
  }

  return (
    <TaskScreenShell
      description="Capture a habit you want to repeat daily and let the streak system handle the rest."
      onBackPress={goBackToHabits}
      title="Create habit"
    >
      <HabitForm
        error={createHabitMutation.error}
        isSubmitting={createHabitMutation.isPending}
        onCancel={goBackToHabits}
        onSubmit={async (values) => {
          const payload = buildCreateHabitPayload(values);

          if (await shouldSubmitOfflineFirst()) {
            createHabitMutation.mutate(payload);
            goBackToHabits();
            return;
          }

          await createHabitMutation.mutateAsync(payload);
          goBackToHabits();
        }}
        submitLabel="Create Habit"
        submittingLabel="Creating..."
      />
    </TaskScreenShell>
  );
}
