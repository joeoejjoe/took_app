import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, Card, BackButton } from '../../components/common';
import { Product } from '../../types/product';
import { formatKRW, formatPercentage } from '../../utils/format';

interface ProductDetailScreenProps {
  product: Product;
  onBack: () => void;
  onDeposit: (product: Product) => void;
}

export default function ProductDetailScreen({
  product,
  onBack,
  onDeposit,
}: ProductDetailScreenProps) {
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>상품 상세</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Info */}
        <View style={styles.section}>
          <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
          <View style={styles.badgeRow}>
            <View style={[
              styles.badge,
              { backgroundColor: colors.surfaceLight },
              product.type === 'flexible' && { backgroundColor: colors.primaryBgStrong },
              product.type === 'locked' && { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
            ]}>
              <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
                {product.type === 'flexible' ? 'Flexible' : `Locked ${product.lockupDays}일`}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.badgeText, { color: colors.textPrimary }]}>{product.asset}</Text>
            </View>
          </View>
        </View>

        {/* APY Card */}
        <Card variant="dark" style={styles.apyCard}>
          <View style={styles.apyRow}>
            <View style={styles.apyItem}>
              <Text style={[styles.apyLabel, { color: colors.textMuted }]}>최고 연 수익률 (APY)</Text>
              <Text style={[styles.apyValue, { color: colors.primary }]}>{formatPercentage(product.maxApy)}</Text>
            </View>
            <View style={[styles.apyDivider, { backgroundColor: colors.border }]} />
            <View style={styles.apyItem}>
              <Text style={[styles.apyLabel, { color: colors.textMuted }]}>총 예치량</Text>
              <Text style={[styles.apyAmount, { color: colors.textPrimary }]}>{formatKRW(product.totalDeposit)}원</Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>상품 정보</Text>
          <DetailRow label="상품 유형" value={product.type === 'flexible' ? '자유 입출금' : '락업 상품'} />
          <DetailRow label="지원 자산" value={product.asset} />
          <DetailRow label="네트워크" value="Ethereum" />
          {product.type === 'locked' && product.lockupDays && (
            <DetailRow label="락업 기간" value={`${product.lockupDays}일`} />
          )}
          <DetailRow label="이자 지급" value="매일 (복리)" />
          <DetailRow label="Tx Fee" value="플랫폼 부담 (무료)" highlight />
        </View>

        {/* Yield Simulation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>예상 수익 시뮬레이션</Text>
          <Card variant="dark" style={styles.simCard}>
            <SimRow label="1,000 USD 예치 시" period="1개월" amount="약 4.5 USD" />
            <SimRow label="" period="6개월" amount="약 27.1 USD" />
            <SimRow label="" period="1년" amount="약 54.2 USD" isLast />
          </Card>
        </View>

        {/* Risk Notice */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>리스크 고지</Text>
          <Card variant="dark" style={styles.riskCard}>
            <View style={styles.riskRow}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={[styles.riskText, { color: colors.textSecondary }]}>
                본 상품은 원금 손실의 위험이 있으며, 과거 수익률이 미래 수익을 보장하지 않습니다.
              </Text>
            </View>
            <View style={styles.riskRow}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={[styles.riskText, { color: colors.textSecondary }]}>
                스마트 컨트랙트 리스크, 시장 리스크 등이 존재합니다. 투자 전 충분히 검토해주세요.
              </Text>
            </View>
            {product.type === 'locked' && (
              <View style={styles.riskRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.warning} />
                <Text style={[styles.riskText, { color: colors.textSecondary }]}>
                  락업 기간 중에는 출금이 불가합니다. 락업 종료 후 출금할 수 있습니다.
                </Text>
              </View>
            )}
          </Card>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <PrimaryButton title="예치하기" onPress={() => onDeposit(product)} />
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: highlight ? colors.primary : colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function SimRow({
  label,
  period,
  amount,
  isLast,
}: {
  label: string;
  period: string;
  amount: string;
  isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.simRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.simLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.simPeriod, { color: colors.textSecondary }]}>{period}</Text>
      <Text style={[styles.simAmount, { color: colors.primary }]}>{amount}</Text>
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  productName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  apyCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  apyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apyItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  apyDivider: {
    width: 1,
    height: 40,
  },
  apyLabel: {
    fontSize: 12,
  },
  apyValue: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
  },
  apyAmount: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  simCard: {
    paddingVertical: 4,
  },
  simRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  simLabel: {
    flex: 1,
    fontSize: 13,
  },
  simPeriod: {
    fontSize: 13,
    marginRight: Spacing.base,
  },
  simAmount: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  riskCard: {
    gap: Spacing.md,
  },
  riskRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  riskText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: 1,
  },
});
