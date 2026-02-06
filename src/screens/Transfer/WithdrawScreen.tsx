import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, BackButton, Card } from '../../components/common';
import { formatUSD } from '../../utils/format';

interface RecipientInfo {
  name: string;
  bank: string;
  account: string;
}

interface WithdrawScreenProps {
  recipient: RecipientInfo;
  onBack: () => void;
  onComplete: () => void;
}

type WithdrawStep = 'amount' | 'confirm' | 'processing' | 'complete';

export default function WithdrawScreen({ recipient, onBack, onComplete }: WithdrawScreenProps) {
  const colors = useColors();
  const [step, setStep] = useState<WithdrawStep>('amount');
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<'USDT' | 'USDC'>('USDT');

  const numericAmount = parseFloat(amount) || 0;
  const mockBalance = 10012;
  const mockTxHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const handleConfirm = () => {
    setStep('confirm');
  };

  const handleExecute = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('complete');
    }, 2500);
  };

  if (step === 'complete') {
    return (
      <WithdrawComplete
        amount={numericAmount}
        asset={selectedAsset}
        recipient={recipient}
        txHash={mockTxHash}
        onDone={onComplete}
      />
    );
  }

  if (step === 'processing') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContent}>
          <ProcessingAnimation />
          <Text style={[styles.processingTitle, { color: colors.textPrimary }]}>출금 처리 중...</Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>
            트랜잭션을 처리하고 있습니다.{'\n'}잠시만 기다려 주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'confirm') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => setStep('amount')} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>출금 확인</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.confirmContent}>
          <Text style={[styles.confirmAmount, { color: colors.textPrimary }]}>
            {formatUSD(numericAmount)} <Text style={[styles.confirmAsset, { color: colors.textMuted }]}>{selectedAsset}</Text>
          </Text>
          <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>출금 금액</Text>

          <Card variant="dark" style={styles.confirmCard}>
            <ConfirmRow label="수신자" value={recipient.name} />
            <ConfirmRow label="은행" value={recipient.bank} />
            <ConfirmRow label="계좌번호" value={recipient.account} />
            <ConfirmRow label="출금 자산" value={selectedAsset} />
            <ConfirmRow label="출금 금액" value={`${formatUSD(numericAmount)} ${selectedAsset}`} highlight />
            <ConfirmRow label="수수료" value="무료 (플랫폼 부담)" highlight isLast />
          </Card>

          <Card variant="dark" style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <Ionicons name="information-circle-outline" size={16} color={colors.info} />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                출금 후 취소가 불가합니다. 수신자 정보를 다시 확인해 주세요.
              </Text>
            </View>
          </Card>
        </View>

        <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
          <PrimaryButton title="출금 실행" onPress={handleExecute} />
        </View>
      </SafeAreaView>
    );
  }

  // Amount input step
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>출금하기</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.amountContent}>
          {/* Recipient info */}
          <Card variant="dark" style={styles.recipientCard}>
            <View style={styles.recipientRow}>
              <View style={[styles.recipientIcon, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <View style={styles.recipientInfo}>
                <Text style={[styles.recipientName, { color: colors.textPrimary }]}>{recipient.name}</Text>
                <Text style={[styles.recipientAccount, { color: colors.textMuted }]}>
                  {recipient.bank} {recipient.account}
                </Text>
              </View>
            </View>
          </Card>

          {/* Asset Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>출금 자산</Text>
            <View style={styles.assetRow}>
              {(['USDT', 'USDC'] as const).map((asset) => (
                <TouchableOpacity
                  key={asset}
                  style={[
                    styles.assetButton,
                    { borderColor: colors.border },
                    selectedAsset === asset && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                  ]}
                  onPress={() => setSelectedAsset(asset)}
                >
                  <Text
                    style={[
                      styles.assetButtonText,
                      { color: colors.textMuted },
                      selectedAsset === asset && { color: colors.primary },
                    ]}
                  >
                    {asset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>출금 금액</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.inputSuffix, { color: colors.textMuted }]}>{selectedAsset}</Text>
            </View>
            <Text style={[styles.balanceText, { color: colors.textMuted }]}>
              출금 가능: {formatUSD(mockBalance)} {selectedAsset}
            </Text>
            <View style={styles.quickRow}>
              {[100, 500, 1000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickButton, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => setAmount(val.toString())}
                >
                  <Text style={[styles.quickButtonText, { color: colors.textSecondary }]}>{formatUSD(val)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: colors.surfaceLight }]}
                onPress={() => setAmount(mockBalance.toString())}
              >
                <Text style={[styles.quickButtonText, { color: colors.textSecondary }]}>전액</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fee */}
          <View style={[styles.feeRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>수수료</Text>
            <Text style={[styles.feeValue, { color: colors.primary }]}>무료 (플랫폼 부담)</Text>
          </View>
        </View>

        <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
          <PrimaryButton
            title="다음"
            onPress={handleConfirm}
            disabled={numericAmount <= 0 || numericAmount > mockBalance}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ConfirmRow({
  label,
  value,
  highlight,
  isLast,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[confirmStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[confirmStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[
        confirmStyles.value,
        { color: colors.textPrimary },
        highlight && { color: colors.primary, fontWeight: FontWeight.semibold },
      ]}>
        {value}
      </Text>
    </View>
  );
}

function ProcessingAnimation() {
  const colors = useColors();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.processingCircle, { backgroundColor: colors.primaryBg, transform: [{ rotate }] }]}>
      <Ionicons name="sync" size={32} color={colors.primary} />
    </Animated.View>
  );
}

function WithdrawComplete({
  amount,
  asset,
  recipient,
  txHash,
  onDone,
}: {
  amount: number;
  asset: string;
  recipient: RecipientInfo;
  txHash: string;
  onDone: () => void;
}) {
  const colors = useColors();
  const checkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkScale, contentOpacity]);

  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.completeContent}>
        <Animated.View style={[styles.successCircle, { backgroundColor: colors.primary, transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={48} color={colors.buttonPrimaryText} />
        </Animated.View>

        <Animated.View style={[styles.completeInfo, { opacity: contentOpacity }]}>
          <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>출금 완료!</Text>
          <Text style={[styles.completeSubtitle, { color: colors.textSecondary }]}>
            출금이 성공적으로 처리되었습니다.
          </Text>

          <Card variant="dark" style={styles.completeCard}>
            <ConfirmRow label="수신자" value={recipient.name} />
            <ConfirmRow label="은행/계좌" value={`${recipient.bank} ${recipient.account}`} />
            <ConfirmRow label="출금 금액" value={`${formatUSD(amount)} ${asset}`} highlight />
            <ConfirmRow label="수수료" value="무료" highlight isLast />
          </Card>

          <View style={[styles.txRow, { backgroundColor: colors.surface }]}>
            <Text style={[styles.txLabel, { color: colors.textMuted }]}>Tx Hash</Text>
            <Text style={[styles.txHash, { color: colors.textSecondary }]}>{shortHash}</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomContainer, { borderTopColor: colors.border, opacity: contentOpacity }]}>
        <PrimaryButton title="확인" onPress={onDone} />
      </Animated.View>
    </SafeAreaView>
  );
}

const confirmStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
  },
  inner: {
    flex: 1,
  },
  // Amount step
  amountContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  recipientCard: {
    marginBottom: Spacing.xl,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  recipientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInfo: {
    flex: 1,
    gap: 2,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  recipientAccount: {
    fontSize: 13,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  assetRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  assetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  assetButtonText: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    paddingVertical: 14,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  balanceText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  // Confirm step
  confirmContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    alignItems: 'center',
  },
  confirmAmount: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  confirmAsset: {
    fontSize: 20,
  },
  confirmLabel: {
    fontSize: 13,
    marginBottom: Spacing.xl,
  },
  confirmCard: {
    width: '100%',
    marginBottom: Spacing.base,
  },
  noticeCard: {
    width: '100%',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  // Processing
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  processingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  processingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Complete
  completeContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  completeInfo: {
    width: '100%',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  completeSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  completeCard: {
    width: '100%',
    marginBottom: Spacing.base,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  txLabel: {
    fontSize: 13,
  },
  txHash: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Bottom
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: 1,
  },
});
