import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AuthStatusCardProps = PropsWithChildren<{
  description: string;
  title: string;
  tone: 'error' | 'success';
}>;

export function AuthStatusCard({
  children,
  description,
  title,
  tone,
}: AuthStatusCardProps) {
  return (
    <View style={[styles.card, tone === 'error' ? styles.errorCard : styles.successCard]}>
      <Text style={[styles.title, tone === 'error' ? styles.errorTitle : styles.successTitle]}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  content: {
    gap: 12,
    marginTop: 4,
  },
  description: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
  },
  errorCard: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  errorTitle: {
    color: '#be123c',
  },
  successCard: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  successTitle: {
    color: '#0f766e',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
