import { useRouter } from 'expo-router';

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
          await createHabitMutation.mutateAsync(buildCreateHabitPayload(values));
          router.replace('/(tabs)/habits');
        }}
        submitLabel="Create Habit"
        submittingLabel="Creating..."
      />
    </TaskScreenShell>
  );
}
