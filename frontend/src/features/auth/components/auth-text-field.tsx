import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type AuthTextFieldProps<TFieldValues extends FieldValues> = {
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  autoCorrect?: boolean;
  control: Control<TFieldValues>;
  error?: string;
  keyboardType?: TextInputProps['keyboardType'];
  label: string;
  name: Path<TFieldValues>;
  placeholder: string;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  secureTextEntry?: boolean;
  textContentType?: TextInputProps['textContentType'];
};

export function AuthTextField<TFieldValues extends FieldValues>({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  control,
  error,
  keyboardType,
  label,
  name,
  placeholder,
  rules,
  secureTextEntry,
  textContentType,
}: AuthTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onBlur, onChange, value } }) => (
        <View style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            keyboardType={keyboardType}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            secureTextEntry={secureTextEntry}
            style={[styles.input, error ? styles.inputError : undefined]}
            textContentType={textContentType}
            value={typeof value === 'string' ? value : ''}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#be123c',
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#fb7185',
  },
  label: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
});
