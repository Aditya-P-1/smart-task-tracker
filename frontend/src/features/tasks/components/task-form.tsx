import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { getApiErrorMessage } from '../../auth/utils/api-error';
import { AuthStatusCard } from '../../auth/components/auth-status-card';
import { AuthSubmitButton } from '../../auth/components/auth-submit-button';
import { DEFAULT_TASK_FORM_VALUES, isValidTaskDueDate } from '../utils/task-form';
import type { TaskFormValues } from '../types/task';
import { TaskFormField } from './task-form-field';

type TaskFormProps = {
  error?: unknown;
  initialValues?: TaskFormValues;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  submitLabel: string;
  submittingLabel?: string;
};

export function TaskForm({
  error,
  initialValues = DEFAULT_TASK_FORM_VALUES,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel,
}: TaskFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<TaskFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const submitTask = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <View style={styles.card}>
      {error ? (
        <AuthStatusCard
          tone="error"
          title="Task request failed"
          description={getApiErrorMessage(
            error,
            'We could not save your task. Please review the details and try again.',
          )}
        />
      ) : null}
      <TaskFormField
        control={control}
        error={errors.title?.message}
        label="Title"
        name="title"
        placeholder="Finish today's priority"
        rules={{
          maxLength: {
            message: 'Title cannot exceed 140 characters.',
            value: 140,
          },
          required: 'Title is required.',
          validate: (value) =>
            (typeof value === 'string' && value.trim().length > 0) || 'Title is required.',
        }}
      />
      <TaskFormField
        control={control}
        error={errors.description?.message}
        label="Description"
        multiline
        name="description"
        numberOfLines={5}
        placeholder="Add context, notes, or acceptance details."
        rules={{
          maxLength: {
            message: 'Description cannot exceed 2000 characters.',
            value: 2000,
          },
        }}
      />
      <TaskFormField
        autoCapitalize="none"
        autoCorrect={false}
        control={control}
        error={errors.dueDate?.message}
        label="Due date"
        name="dueDate"
        placeholder="YYYY-MM-DD or 2026-05-10T18:30:00Z"
        rules={{
          validate: (value) =>
            (typeof value === 'string' && isValidTaskDueDate(value)) ||
            'Enter a valid date or leave it blank.',
        }}
      />
      <Controller
        control={control}
        name="completed"
        render={({ field: { onChange, value } }) => (
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>Completed</Text>
              <Text style={styles.switchDescription}>
                Toggle this if the task is already done when you save it.
              </Text>
            </View>
            <Switch
              onValueChange={onChange}
              trackColor={{ false: '#cbd5e1', true: '#14b8a6' }}
              thumbColor={value ? '#ffffff' : '#ffffff'}
              value={Boolean(value)}
            />
          </View>
        )}
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
            void submitTask().catch(() => undefined);
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
    marginTop: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#dbeafe',
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switchDescription: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  switchLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  switchRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
