import { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type AuthScreenShellProps = PropsWithChildren<{
  description: string;
  eyebrow: string;
  footer?: ReactNode;
  title: string;
}>;

export function AuthScreenShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: AuthScreenShellProps) {
  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="always"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backgroundOrbOne: {
    backgroundColor: '#ccfbf1',
    borderRadius: 180,
    height: 180,
    opacity: 0.8,
    position: 'absolute',
    right: -40,
    top: 60,
    width: 180,
  },
  backgroundOrbTwo: {
    backgroundColor: '#dbeafe',
    borderRadius: 160,
    bottom: 80,
    height: 160,
    left: -50,
    opacity: 0.85,
    position: 'absolute',
    width: 160,
  },
  body: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: '#dbeafe',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    maxWidth: 520,
    padding: 24,
    width: '100%',
  },
  description: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 4,
  },
  keyboardContainer: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  title: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
});
