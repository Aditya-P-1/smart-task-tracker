import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HabitListItem } from '../types/habit';
import { formatLatestCheckIn, isHabitCompletedToday } from '../utils/habit';

type HabitListItemCardProps = {
  isDeleting?: boolean;
  habit: HabitListItem;
  isCheckingIn?: boolean;
  onDelete: () => void;
  onCheckIn: () => void;
};

export function HabitListItemCard({
  habit,
  isDeleting = false,
  isCheckingIn = false,
  onDelete,
  onCheckIn,
}: HabitListItemCardProps) {
  const completedToday = habit.completedToday ?? isHabitCompletedToday(habit);
  const isBusy = isCheckingIn || isDeleting || habit.isPending;

  return (
    <View style={[styles.card, completedToday ? styles.completedCard : undefined]}>
      <View style={styles.headerRow}>
        <View style={styles.copyBlock}>
          <View style={styles.badgeRow}>
            <Text style={[styles.statusBadge, completedToday ? styles.doneBadge : styles.openBadge]}>
              {completedToday ? 'Done today' : 'Ready today'}
            </Text>
            {habit.isPending ? <Text style={styles.pendingBadge}>Syncing</Text> : null}
          </View>
          <Text style={styles.title}>{habit.title}</Text>
        </View>
        <View style={[styles.streakBubble, habit.streak > 0 ? styles.hotStreakBubble : undefined]}>
          <Text style={styles.streakValue}>{habit.streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Last check-in {formatLatestCheckIn(habit)}</Text>
        <Text style={styles.metaLabel}>{habit.completedDates.length} total check-ins</Text>
      </View>
      <View style={styles.actionsRow}>
        <Pressable
          disabled={completedToday || isBusy}
          onPress={onCheckIn}
          style={({ pressed }) => [
            styles.checkInButton,
            styles.flexButton,
            completedToday ? styles.checkInButtonDone : undefined,
            pressed ? styles.pressed : undefined,
            completedToday || isBusy ? styles.disabled : undefined,
          ]}
        >
          <Text style={[styles.checkInLabel, completedToday ? styles.checkInLabelDone : undefined]}>
            {completedToday ? 'Checked In Today' : isCheckingIn ? 'Checking In...' : 'Check In'}
          </Text>
        </Pressable>
        <Pressable
          disabled={isBusy}
          onPress={onDelete}
          style={({ pressed }) => [
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
  checkInButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkInButtonDone: {
    backgroundColor: '#dcfce7',
  },
  checkInLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  checkInLabelDone: {
    color: '#166534',
  },
  completedCard: {
    backgroundColor: '#f8fafc',
  },
  copyBlock: {
    flex: 1,
    gap: 10,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 92,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deleteLabel: {
    color: '#be123c',
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.7,
  },
  flexButton: {
    flex: 1,
  },
  doneBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  hotStreakBubble: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
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
  openBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
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
  statusBadge: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakBubble: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  streakLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  streakValue: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
});
