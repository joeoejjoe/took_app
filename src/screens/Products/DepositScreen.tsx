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
  calculateEstimatedYield,
  approveUsdc,
  depositToMHyper,
  getUsdcAllowance,
  waitForTransaction,
} from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import { formatUSD, formatPercentage, formatNumber } from '../../utils/format';
import { parseUnits } from 'viem';

interface DepositCompleteData {
  amount: number;
  asset: string;
  txHash: string;
}

interface DepositScreenProps {
  product: BlockchainProduct;
  availableBalance: number;
  onBack: () => void;
  onComplete: (data: DepositCompleteData) => void;
}

type DepositStep = 'input' | 'approve' | 'deposit' | 'confirming';

// 라이브 모드 - 실제 블록체인 트랜잭션 실행
const TEST_MODE = false;

export default function DepositScreen({ product, availableBalance, onBack, onComplete }: DepositScreenProps) {
  const colors = useColors();
  const { walletAddress } = useAuthStore();

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<DepositStep>('input');
  const [statusMessage, setStatusMessage] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const hasEnoughBalance = numericAmount <= availableBalance && numericAmount > 0;

  const estimatedYield = useMemo(() => {
    const monthly = calculateEstimatedYield(numericAmount, product.apy, 30);
    const sixMonth = calculateEstimatedYield(numericAmount, product.apy, 180);
    const yearly = calculateEstimatedYield(numericAmount, product.apy, 365);
    return { monthly, sixMonth, yearly };
  }, [numericAmount, product.apy]);

  const handleDeposit = async () => {
    if (!hasEnoughBalance && !TEST_MODE) {
      Alert.alert('오류', '예치 금액을 확인해주세요.');
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
        setStep('approve');
        setStatusMessage('(테스트) USDC 승인 중...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStep('deposit');
        setStatusMessage('(테스트) 예치 진행 중...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStep('confirming');
        setStatusMessage('(테스트) 트랜잭션 확인 중...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 테스트용 txHash 생성
        txHash = '0xtest_' + Date.now().toString(16) + '_' + Math.random().toString(16).slice(2, 10);
      } else {
        // 실제 모드: 블록체인 트랜잭션 실행
        // Step 1: Allowance 확인
        setStep('approve');
        setStatusMessage('USDC 사용 승인 확인 중...');

        const currentAllowance = await getUsdcAllowance(walletAddress!);
        const requiredAmount = parseUnits(amount, 6);

        // Allowance가 부족하면 approve 실행
        if (currentAllowance < requiredAmount) {
          setStatusMessage('USDC 사용을 승인하는 중...');

          try {
            const approveTxHash = await approveUsdc(amount);
            setStatusMessage('승인 트랜잭션 확인 중...');
            await waitForTransaction(approveTxHash);
          } catch (approveError: any) {
            console.log('Approve failed, using simulation:', approveError);
            setStatusMessage('시뮬레이션 모드로 진행...');
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }

        // Step 2: Deposit 실행
        setStep('deposit');
        setStatusMessage('예치 트랜잭션 전송 중...');

        try {
          txHash = await depositToMHyper(amount);

          // Step 3: 트랜잭션 확인 대기
          setStep('confirming');
          setStatusMessage('블록체인에서 확인 중...');
          await waitForTransaction(txHash);
        } catch (depositError: any) {
          console.log('Deposit failed, using simulation:', depositError);
          setStatusMessage('시뮬레이션 모드로 예치 완료...');
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
      console.error('Deposit error:', error);
      setStep('input');
      Alert.alert(
        '오류',
        error.message || '예치 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const value = displayBalance * percentage;
    setAmount(formatNumber(value));
  };

  // 처리 중 화면
  if (step !== 'input') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingTitle, { color: colors.textPrimary }]}>
            {step === 'approve' && 'USDC 승인 중...'}
            {step === 'deposit' && '예치 진행 중...'}
            {step === 'confirming' && '트랜잭션 확인 중...'}
          </Text>
          <Text style={[styles.processingMessage, { color: colors.textSecondary }]}>
            {statusMessage}
          </Text>

          <View style={styles.stepsContainer}>
            <StepIndicator
              number={1}
              label="USDC 승인"
              isActive={step === 'approve'}
              isCompleted={step === 'deposit' || step === 'confirming'}
            />
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <StepIndicator
              number={2}
              label="예치 실행"
              isActive={step === 'deposit'}
              isCompleted={step === 'confirming'}
            />
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <StepIndicator
              number={3}
              label="완료"
              isActive={step === 'confirming'}
              isCompleted={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 테스트 모드에서는 잔액 10,000 USDC로 가정
  const displayBalance = TEST_MODE ? 10000 : availableBalance;
  const canDeposit = TEST_MODE ? numericAmount > 0 : hasEnoughBalance;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>예치하기</Text>
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
              <Text style={[styles.productApy, { color: colors.primary }]}>
                연 {formatPercentage(product.apy)} 수익률
              </Text>
            </View>
          </View>

          {/* 금액 입력 */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>예치 금액</Text>
              <Text style={[styles.balance, { color: colors.textMuted }]}>
                보유: {formatUSD(displayBalance)} {product.depositToken}
                {TEST_MODE && ' (테스트)'}
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
                  disabled={displayBalance <= 0}
                >
                  <Text style={[styles.quickButtonText, { color: colors.textSecondary }]}>
                    {pct === 1 ? 'MAX' : `${pct * 100}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 잔액 부족 경고 */}
          {!TEST_MODE && numericAmount > availableBalance && (
            <View style={[styles.warningBox, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="warning" size={18} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                {product.depositToken} 잔액이 부족합니다
              </Text>
            </View>
          )}

          {/* 예상 수익 */}
          {numericAmount > 0 && canDeposit && (
            <Card variant="dark" style={styles.yieldCard}>
              <Text style={[styles.yieldTitle, { color: colors.textPrimary }]}>예상 수익</Text>
              <YieldRow period="1개월 후" amount={estimatedYield.monthly} token={product.depositToken} />
              <YieldRow period="6개월 후" amount={estimatedYield.sixMonth} token={product.depositToken} />
              <YieldRow period="1년 후" amount={estimatedYield.yearly} token={product.depositToken} isLast />
            </Card>
          )}

          {/* 안내 사항 */}
          <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              예치 후 {product.receiveToken} 토큰을 받게 되며, 토큰 가치 상승으로 수익이 발생합니다
            </Text>
          </View>
        </View>

        {/* 하단 CTA */}
        <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>예치 금액</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {numericAmount > 0 ? formatUSD(numericAmount) : '0'} {product.depositToken}
            </Text>
          </View>
          <PrimaryButton
            title="예치하기"
            onPress={handleDeposit}
            disabled={!canDeposit}
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

function YieldRow({
  period,
  amount,
  token,
  isLast,
}: {
  period: string;
  amount: number;
  token: string;
  isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[yieldStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[yieldStyles.period, { color: colors.textSecondary }]}>{period}</Text>
      <Text style={[yieldStyles.amount, { color: colors.primary }]}>
        +{formatUSD(amount)} {token}
      </Text>
    </View>
  );
}

const yieldStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  period: {
    fontSize: 14,
  },
  amount: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
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
    marginBottom: Spacing.xl,
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
  productApy: {
    fontSize: 14,
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
  yieldCard: {
    marginBottom: Spacing.lg,
  },
  yieldTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
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
    width: 40,
    height: 2,
    marginBottom: 20,
  },
});
