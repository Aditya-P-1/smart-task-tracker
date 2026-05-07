import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AuthStatusCard } from '../../auth/components/auth-status-card';
import { AuthSubmitButton } from '../../auth/components/auth-submit-button';
import { getApiErrorMessage } from '../../auth/utils/api-error';
import { TaskFormField } from '../../tasks/components/task-form-field';
import type { HabitFormValues } from '../types/habit';
import { DEFAULT_HABIT_FORM_VALUES } from '../utils/habit';

type HabitFormProps = {
  error?: unknown;
  initialValues?: HabitFormValues;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: HabitFormValues) => Promise<void> | void;
  submitLabel: string;
  submittingLabel?: string;
};

export function HabitForm({
  error,
  initialValues = DEFAULT_HABIT_FORM_VALUES,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel,
}: HabitFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<HabitFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const submitHabit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <View style={styles.card}>
      {error ? (
        <AuthStatusCard
          tone="error"
          title="Habit request failed"
          description={getApiErrorMessage(
            error,
            'We could not save your habit. Please review the title and try again.',
          )}
        />
      ) : null}
      <TaskFormField
        control={control}
        error={errors.title?.message}
        label="Habit title"
        name="title"
        placeholder="Read 10 pages"
        rules={{
          maxLength: {
            message: 'Habit title cannot exceed 140 characters.',
            value: 140,
          },
          required: 'Habit title is required.',
          validate: (value) =>
            (typeof value === 'string' && value.trim().length > 0) || 'Habit title is required.',
        }}
      />
      <View style={styles.buttonRow}>
        {onCancel ? (
          <AuthSubmitButton label="Cancel" onPress={onCancel} variant="secondary" />
        ) : null}
        <AuthSubmitButton
          isLoading={isSubmitting}
          label={submitLabel}
          loadingLabel={submittingLabel}
          onPress={() => {
            void submitHabit().catch(() => undefined);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#dbeafe',
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
});
