import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type TaskFormFieldProps<TFieldValues extends FieldValues> = {
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  control: Control<TFieldValues>;
  error?: string;
  keyboardType?: TextInputProps['keyboardType'];
  label: string;
  multiline?: boolean;
  name: Path<TFieldValues>;
  numberOfLines?: number;
  placeholder: string;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
};

export function TaskFormField<TFieldValues extends FieldValues>({
  autoCapitalize = 'sentences',
  autoCorrect = true,
  control,
  error,
  keyboardType,
  label,
  multiline = false,
  name,
  numberOfLines,
  placeholder,
  rules,
}: TaskFormFieldProps<TFieldValues>) {
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
            autoCorrect={autoCorrect}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            style={[
              styles.input,
              multiline ? styles.multilineInput : undefined,
              error ? styles.inputError : undefined,
            ]}
            textAlignVertical={multiline ? 'top' : 'center'}
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
    borderRadius: 18,
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
    fontWeight: '700',
  },
  multilineInput: {
    minHeight: 120,
  },
});
