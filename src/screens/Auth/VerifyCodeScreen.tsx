import React, { useState, useRef, useEffect } from 'react';
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

const CODE_LENGTH = 6;

interface VerifyCodeScreenProps {
  email: string;
  onVerify: (code: string) => void;
  onBack: () => void;
  onResend: () => void;
}

export default function VerifyCodeScreen({
  email,
  onVerify,
  onBack,
  onResend,
}: VerifyCodeScreenProps) {
  const colors = useColors();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleCodeChange = (text: string, index: number) => {
    if (error) setError('');
    const newCode = [...code];

    if (text.length > 1) {
      // Handle paste
      const pasted = text.slice(0, CODE_LENGTH).split('');
      pasted.forEach((char, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pasted.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newCode[index] = text;
      setCode(newCode);
      if (text && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      setError('인증 코드 6자리를 모두 입력해주세요.');
      return;
    }
    onVerify(fullCode);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setCode(Array(CODE_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    onResend();
  };

  const isComplete = code.every((c) => c !== '');

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
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>인증 코드 입력</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              <Text style={[styles.emailHighlight, { color: colors.primary }]}>{email}</Text>
              {'\n'}으로 전송된 6자리 코드를 입력해주세요.
            </Text>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.codeInput,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                    digit ? { borderColor: colors.primary } : null,
                    error ? { borderColor: colors.error } : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? CODE_LENGTH : 1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

            <View style={styles.resendContainer}>
              <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>코드를 받지 못하셨나요? </Text>
              <Text
                style={[
                  styles.resendButton,
                  { color: colors.primary },
                  resendTimer > 0 && { color: colors.textMuted },
                ]}
                onPress={handleResend}
              >
                {resendTimer > 0 ? `재전송 (${resendTimer}s)` : '재전송'}
              </Text>
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <PrimaryButton
              title="확인"
              onPress={handleSubmit}
              disabled={!isComplete}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    height: 48,
    justifyContent: 'center',
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
  emailHighlight: {
    fontWeight: FontWeight.semibold,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  errorText: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  resendLabel: {
    fontSize: 14,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
