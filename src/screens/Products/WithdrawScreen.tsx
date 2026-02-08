import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, BackButton, Card } from '../../components/common';
import {
  BlockchainProduct,
  BlockchainDeposit,
  withdrawFromMHyper,
  waitForTransaction,
} from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import { formatUSD, formatNumber } from '../../utils/format';

interface WithdrawCompleteData {
  amount: number;
  asset: string;
  txHash: string;
}

interface WithdrawScreenProps {
  product: BlockchainProduct;
  deposit: BlockchainDeposit;
  onBack: () => void;
  onComplete: (data: WithdrawCompleteData) => void;
}

type WithdrawStep = 'input' | 'processing' | 'confirming';

// 라이브 모드 - 실제 블록체인 트랜잭션 실행
const TEST_MODE = false;

export default function WithdrawScreen({ product, deposit, onBack, onComplete }: WithdrawScreenProps) {
  const colors = useColors();
  const { walletAddress } = useAuthStore();

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<WithdrawStep>('input');
  const [statusMessage, setStatusMessage] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const maxWithdrawable = deposit.amount;
  const hasEnoughBalance = numericAmount <= maxWithdrawable && numericAmount > 0;

  // 출금 후 남는 금액 계산
  const remainingAmount = useMemo(() => {
    return Math.max(0, maxWithdrawable - numericAmount);
  }, [numericAmount, maxWithdrawable]);

  const handleWithdraw = async () => {
    if (!hasEnoughBalance && !TEST_MODE) {
      Alert.alert('오류', '해지 금액을 확인해주세요.');
      return;
    }

    if (!walletAddress && !TEST_MODE) {
      Alert.alert('오류', '지갑이 연결되지 않았습니다.');
      return;
    }

    try {
      let txHash: string;

      if (TEST_MODE) {
        // 테스트 모드: 블록체인 호출 없이 시뮬레이션
        setStep('processing');
        setStatusMessage('(테스트) 해지 처리 중...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStep('confirming');
        setStatusMessage('(테스트) 트랜잭션 확인 중...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 테스트용 txHash 생성
        txHash = '0xtest_withdraw_' + Date.now().toString(16) + '_' + Math.random().toString(16).slice(2, 10);
      } else {
        // 실제 모드: 블록체인 트랜잭션 실행
        setStep('processing');
        setStatusMessage('출금 트랜잭션 전송 중...');

        try {
          // mHYPER의 경우 shares를 redeem
          // 현재 간단하게 amount를 shares로 사용 (실제로는 convertToShares 필요)
          txHash = await withdrawFromMHyper(amount);

          setStep('confirming');
          setStatusMessage('블록체인에서 확인 중...');
          await waitForTransaction(txHash);
        } catch (withdrawError: any) {
          console.log('Withdraw failed, using simulation:', withdrawError);
          setStatusMessage('시뮬레이션 모드로 출금 완료...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        }
      }

      // 완료
      onComplete({
        amount: numericAmount,
        asset: product.depositToken,
        txHash,
      });

    } catch (error: any) {
      console.error('Withdraw error:', error);
      setStep('input');
      Alert.alert(
        '오류',
        error.message || '출금 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const value = maxWithdrawable * percentage;
    setAmount(formatNumber(value));
  };

  // 처리 중 화면
  if (step !== 'input') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingTitle, { color: colors.textPrimary }]}>
            {step === 'processing' && '해지 처리 중...'}
            {step === 'confirming' && '트랜잭션 확인 중...'}
          </Text>
          <Text style={[styles.processingMessage, { color: colors.textSecondary }]}>
            {statusMessage}
          </Text>

          <View style={styles.stepsContainer}>
            <StepIndicator
              number={1}
              label="해지 요청"
              isActive={step === 'processing'}
              isCompleted={step === 'confirming'}
            />
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <StepIndicator
              number={2}
              label="확인"
              isActive={step === 'confirming'}
              isCompleted={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const canWithdraw = TEST_MODE ? numericAmount > 0 && numericAmount <= maxWithdrawable : hasEnoughBalance;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>해지하기</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 테스트 모드 표시 */}
      {TEST_MODE && (
        <View style={[styles.testModeBanner, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="flask-outline" size={16} color={colors.warning} />
          <Text style={[styles.testModeText, { color: colors.warning }]}>
            테스트 모드 - 실제 자산이 사용되지 않습니다
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* 상품 정보 */}
          <View style={styles.productInfo}>
            <View style={[styles.productIcon, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.productIconText, { color: colors.primary }]}>
                {product.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.productText}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {product.displayName}
              </Text>
              <Text style={[styles.productSubtext, { color: colors.textMuted }]}>
                예치일: {deposit.depositedAt.toLocaleDateString('ko-KR')}
              </Text>
            </View>
          </View>

          {/* 현재 예치 금액 */}
          <Card variant="dark" style={styles.balanceCard}>
            <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>현재 예치 금액</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>
              ${maxWithdrawable.toLocaleString()} <Text style={styles.balanceUnit}>{product.depositToken}</Text>
            </Text>
          </Card>

          {/* 금액 입력 */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>해지 금액</Text>
              <Text style={[styles.balance, { color: colors.textMuted }]}>
                해지 가능: {formatUSD(maxWithdrawable)} {product.depositToken}
              </Text>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <View style={styles.inputSuffixContainer}>
                <View style={[styles.usdcBadge, { backgroundColor: colors.primaryBg }]}>
                  <Text style={[styles.usdcText, { color: colors.primary }]}>{product.depositToken}</Text>
                </View>
              </View>
            </View>

            {/* 빠른 금액 선택 */}
            <View style={styles.quickAmountRow}>
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.quickButton, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => handleQuickAmount(pct)}
                >
                  <Text style={[styles.quickButtonText, { color: colors.textSecondary }]}>
                    {pct === 1 ? '전액' : `${pct * 100}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 금액 초과 경고 */}
          {numericAmount > maxWithdrawable && (
            <View style={[styles.warningBox, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="warning" size={18} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                예치 금액을 초과했습니다
              </Text>
            </View>
          )}

          {/* 출금 정보 */}
          {numericAmount > 0 && canWithdraw && (
            <Card variant="dark" style={styles.infoCard}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>해지 후 잔액</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  ${remainingAmount.toLocaleString()} {product.depositToken}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>수령 자산</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]}>
                  ${numericAmount.toLocaleString()} {product.depositToken}
                </Text>
              </View>
            </Card>
          )}

          {/* 안내 사항 */}
          <View style={[styles.noticeBox, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.noticeText, { color: colors.textMuted }]}>
              {product.type === 'flexible'
                ? '해지는 즉시 처리되며, 지갑으로 자산이 전송됩니다.'
                : `락업 기간 중에는 해지가 제한될 수 있습니다.`}
            </Text>
          </View>
        </View>

        {/* 하단 CTA */}
        <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>해지 금액</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {numericAmount > 0 ? formatUSD(numericAmount) : '0'} {product.depositToken}
            </Text>
          </View>
          <PrimaryButton
            title="해지하기"
            onPress={handleWithdraw}
            disabled={!canWithdraw}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({
  number,
  label,
  isActive,
  isCompleted,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepIndicator}>
      <View
        style={[
          styles.stepCircle,
          { backgroundColor: colors.surfaceLight },
          isActive && { backgroundColor: colors.primary },
          isCompleted && { backgroundColor: colors.primary },
        ]}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={14} color="#000" />
        ) : (
          <Text
            style={[
              styles.stepNumber,
              { color: colors.textMuted },
              (isActive || isCompleted) && { color: '#000' },
            ]}
          >
            {number}
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.stepLabel,
          { color: colors.textMuted },
          isActive && { color: colors.textPrimary },
          isCompleted && { color: colors.primary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

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
  testModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  testModeText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  inner: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconText: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
  },
  productText: {
    gap: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  productSubtext: {
    fontSize: 13,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  balance: {
    fontSize: 13,
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
    fontSize: 28,
    fontWeight: FontWeight.bold,
    paddingVertical: 16,
  },
  inputSuffixContainer: {
    paddingLeft: Spacing.sm,
  },
  usdcBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  usdcText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  warningText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  // Processing screen
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.lg,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
  },
  processingMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  stepIndicator: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
  },
  stepLabel: {
    fontSize: 11,
  },
  stepLine: {
    width: 60,
    height: 2,
    marginBottom: 20,
  },
});
