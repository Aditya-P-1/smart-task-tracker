import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type AuthSubmitButtonProps = {
  isLoading?: boolean;
  label: string;
  loadingLabel?: string;
  onPress?: () => void;
  variant?: 'ghost' | 'primary' | 'secondary';
};

export function AuthSubmitButton({
  isLoading = false,
  label,
  loadingLabel,
  onPress,
  variant = 'primary',
}: AuthSubmitButtonProps) {
  const displayLabel = isLoading ? loadingLabel ?? label : label;

  return (
    <Pressable
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primaryButton : undefined,
        variant === 'secondary' ? styles.secondaryButton : undefined,
        variant === 'ghost' ? styles.ghostButton : undefined,
        pressed ? styles.pressedButton : undefined,
        isLoading ? styles.disabledButton : undefined,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? '#0f766e' : variant === 'secondary' ? '#0f172a' : '#ffffff'}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          variant === 'primary' ? styles.primaryLabel : undefined,
          variant === 'secondary' ? styles.secondaryLabel : undefined,
          variant === 'ghost' ? styles.ghostLabel : undefined,
        ]}
      >
        {displayLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.8,
  },
  ghostButton: {
    backgroundColor: '#ffffff',
    borderColor: '#99f6e4',
    borderWidth: 1,
  },
  ghostLabel: {
    color: '#0f766e',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressedButton: {
    opacity: 0.9,
  },
  primaryButton: {
    backgroundColor: '#0f766e',
  },
  primaryLabel: {
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
  },
  secondaryLabel: {
    color: '#0f172a',
  },
});
