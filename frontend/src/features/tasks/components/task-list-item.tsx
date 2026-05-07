import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TaskListItem } from '../types/task';
import { formatTaskDueDate } from '../utils/task-form';

type TaskListItemProps = {
  isDeleting?: boolean;
  isUpdating?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggleComplete: () => void;
  task: TaskListItem;
};

export function TaskListItemCard({
  isDeleting = false,
  isUpdating = false,
  onDelete,
  onEdit,
  onToggleComplete,
  task,
}: TaskListItemProps) {
  const isBusy = isDeleting || isUpdating || task.isPending;

  return (
    <View style={[styles.card, task.completed ? styles.completedCard : undefined]}>
      <View style={styles.row}>
        <View style={styles.copyBlock}>
          <View style={styles.badgeRow}>
            <Text style={[styles.statusBadge, task.completed ? styles.doneBadge : styles.todoBadge]}>
              {task.completed ? 'Completed' : 'Open'}
            </Text>
            {task.isPending ? <Text style={styles.pendingBadge}>Syncing</Text> : null}
          </View>
          <Text style={[styles.title, task.completed ? styles.completedTitle : undefined]}>
            {task.title}
          </Text>
          {task.description ? <Text style={styles.description}>{task.description}</Text> : null}
        </View>
        <Pressable
          disabled={isBusy}
          onPress={onToggleComplete}
          style={({ pressed }) => [
            styles.toggleButton,
            task.completed ? styles.toggleButtonCompleted : undefined,
            pressed ? styles.pressed : undefined,
            isBusy ? styles.disabled : undefined,
          ]}
        >
          <Text style={[styles.toggleLabel, task.completed ? styles.toggleLabelCompleted : undefined]}>
            {task.completed ? 'Undo' : 'Done'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Due {formatTaskDueDate(task.dueDate)}</Text>
        <Text style={styles.metaLabel}>
          Updated {new Date(task.updatedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actionsRow}>
        <Pressable
          disabled={isBusy}
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed ? styles.pressed : undefined,
            isBusy ? styles.disabled : undefined,
          ]}
        >
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
        <Pressable
          disabled={isBusy}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.actionButton,
            styles.deleteButton,
            pressed ? styles.pressed : undefined,
            isBusy ? styles.disabled : undefined,
          ]}
        >
          <Text style={styles.deleteLabel}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 46,
    minWidth: 92,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  completedCard: {
    backgroundColor: '#f8fafc',
  },
  completedTitle: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  copyBlock: {
    flex: 1,
    gap: 10,
  },
  deleteButton: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  deleteLabel: {
    color: '#be123c',
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  disabled: {
    opacity: 0.65,
  },
  doneBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  editButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  editLabel: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '700',
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pendingBadge: {
    backgroundColor: '#ecfeff',
    borderRadius: 999,
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pressed: {
    opacity: 0.9,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  todoBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  toggleButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleButtonCompleted: {
    backgroundColor: '#e2e8f0',
  },
  toggleLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleLabelCompleted: {
    color: '#0f172a',
  },
});
