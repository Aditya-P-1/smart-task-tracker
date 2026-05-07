import { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TaskScreenShellProps = PropsWithChildren<{
  action?: ReactNode;
  description?: string;
  onBackPress?: () => void;
  title: string;
}>;

export function TaskScreenShell({
  action,
  children,
  description,
  onBackPress,
  title,
}: TaskScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {onBackPress ? (
                <Pressable
                  onPress={onBackPress}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed ? styles.pressed : undefined,
                  ]}
                >
                  <Text style={styles.backLabel}>Back</Text>
                </Pressable>
              ) : null}
              <Text style={styles.title}>{title}</Text>
              {description ? <Text style={styles.description}>{description}</Text> : null}
            </View>
            {action ? <View style={styles.actionSlot}>{action}</View> : null}
          </View>
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionSlot: {
    alignSelf: 'flex-start',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#bfdbfe',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backLabel: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    gap: 16,
  },
  description: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  header: {
    gap: 16,
  },
  headerCopy: {
    gap: 8,
  },
  heroGlowOne: {
    backgroundColor: '#bfdbfe',
    borderRadius: 180,
    height: 180,
    opacity: 0.35,
    position: 'absolute',
    right: -60,
    top: 10,
    width: 180,
  },
  heroGlowTwo: {
    backgroundColor: '#99f6e4',
    borderRadius: 140,
    bottom: 90,
    height: 140,
    left: -40,
    opacity: 0.5,
    position: 'absolute',
    width: 140,
  },
  keyboardContainer: {
    flex: 1,
  },
  pressed: {
    opacity: 0.88,
  },
  safeArea: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
});
