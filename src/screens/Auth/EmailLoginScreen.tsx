import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton } from '../../components/common';

interface EmailLoginScreenProps {
  onSubmit: (email: string) => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function EmailLoginScreen({ onSubmit, onBack, onSkip }: EmailLoginScreenProps) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setError('');
    onSubmit(email.trim());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <Text style={[styles.backButton, { color: colors.textPrimary }]} onPress={onBack}>
              ←
            </Text>
            {onSkip && (
              <Text style={[styles.skipText, { color: colors.textSecondary }]} onPress={onSkip}>
                건너뛰기
              </Text>
            )}
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>이메일로 시작하기</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              이메일 주소를 입력하면{'\n'}인증 코드를 보내드려요.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>이메일</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                  error ? { borderColor: colors.error } : null,
                ]}
                placeholder="example@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <PrimaryButton
              title="인증 코드 받기"
              onPress={handleSubmit}
              disabled={!email.trim()}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    height: 48,
  },
  skipText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  backButton: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing['3xl'],
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  input: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
