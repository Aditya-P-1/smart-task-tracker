import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ScreenPlaceholderProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function ScreenPlaceholder({
  title,
  description,
  children,
}: ScreenPlaceholderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Project Architecture</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    maxWidth: 520,
    padding: 24,
    width: '100%',
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
});
