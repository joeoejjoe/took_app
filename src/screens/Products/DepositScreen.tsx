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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, BackButton, Card } from '../../components/common';
import { Product } from '../../types/product';
import { formatUSD, formatPercentage } from '../../utils/format';

type AssetType = 'USDT' | 'USDC';

interface DepositCompleteData {
  product: Product;
  amount: number;
  asset: string;
  txHash: string;
}

interface DepositScreenProps {
  product: Product;
  onBack: () => void;
  onComplete: (data: DepositCompleteData) => void;
}

export default function DepositScreen({ product, onBack, onComplete }: DepositScreenProps) {
  const colors = useColors();
  const [selectedAsset, setSelectedAsset] = useState<AssetType>(product.asset);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const numericAmount = parseFloat(amount) || 0;

  const estimatedYield = useMemo(() => {
    const monthly = numericAmount * (product.maxApy / 100) / 12;
    const sixMonth = numericAmount * (product.maxApy / 100) / 2;
    const yearly = numericAmount * (product.maxApy / 100);
    return { monthly, sixMonth, yearly };
  }, [numericAmount, product.maxApy]);

  const handleDeposit = async () => {
    if (numericAmount <= 0) {
      Alert.alert('오류', '예치 금액을 입력해주세요.');
      return;
    }
    setIsProcessing(true);
    // TODO: Reown AppKit 트랜잭션 서명
    setTimeout(() => {
      setIsProcessing(false);
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      onComplete({
        product,
        amount: numericAmount,
        asset: selectedAsset,
        txHash: mockTxHash,
      });
    }, 2000);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>예치하기</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Product Info */}
          <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
          <Text style={[styles.productApy, { color: colors.textSecondary }]}>
            연 수익률 <Text style={[styles.apyHighlight, { color: colors.primary }]}>{formatPercentage(product.maxApy)}</Text>
          </Text>

          {/* Asset Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>자산 선택</Text>
            <View style={styles.assetRow}>
              {(['USDT', 'USDC'] as AssetType[]).map((asset) => (
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>예치 금액</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.inputSuffix, { color: colors.textMuted }]}>{selectedAsset}</Text>
            </View>
            <View style={styles.quickAmountRow}>
              {[100, 500, 1000, 5000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickButton, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => handleQuickAmount(val)}
                >
                  <Text style={[styles.quickButtonText, { color: colors.textSecondary }]}>{formatUSD(val)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Estimated Yield */}
          {numericAmount > 0 && (
            <Card variant="dark" style={styles.yieldCard}>
              <Text style={[styles.yieldTitle, { color: colors.textPrimary }]}>예상 수익</Text>
              <YieldRow period="1개월" amount={estimatedYield.monthly} asset={selectedAsset} />
              <YieldRow period="6개월" amount={estimatedYield.sixMonth} asset={selectedAsset} />
              <YieldRow period="1년" amount={estimatedYield.yearly} asset={selectedAsset} isLast />
            </Card>
          )}

          {/* Fee Info */}
          <View style={[styles.feeRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Tx Fee</Text>
            <Text style={[styles.feeValue, { color: colors.primary }]}>무료 (플랫폼 부담)</Text>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
          <PrimaryButton
            title="예치하기"
            onPress={handleDeposit}
            disabled={numericAmount <= 0}
            loading={isProcessing}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function YieldRow({
  period,
  amount,
  asset,
  isLast,
}: {
  period: string;
  amount: number;
  asset: string;
  isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[yieldStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[yieldStyles.period, { color: colors.textSecondary }]}>{period}</Text>
      <Text style={[yieldStyles.amount, { color: colors.primary }]}>
        +{formatUSD(amount)} <Text style={[yieldStyles.asset, { color: colors.textMuted }]}>{asset}</Text>
      </Text>
    </View>
  );
}

const yieldStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  period: {
    fontSize: 13,
  },
  amount: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  asset: {
    fontSize: 12,
    fontWeight: FontWeight.regular,
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  productName: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  productApy: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  apyHighlight: {
    fontWeight: FontWeight.semibold,
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
  quickAmountRow: {
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
  yieldCard: {
    marginBottom: Spacing.lg,
  },
  yieldTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
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
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: 1,
  },
});
