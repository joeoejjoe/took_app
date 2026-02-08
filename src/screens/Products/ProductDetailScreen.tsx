import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, Card, BackButton } from '../../components/common';
import { BlockchainProduct, calculateEstimatedYield } from '../../services';
import { formatUSD, formatPercentage } from '../../utils/format';

interface ProductDetailScreenProps {
  product: BlockchainProduct;
  onBack: () => void;
  onDeposit: () => void;
}

export default function ProductDetailScreen({
  product,
  onBack,
  onDeposit,
}: ProductDetailScreenProps) {
  const colors = useColors();

  // 예상 수익 계산 (1000 USDC 기준)
  const sampleAmount = 1000;
  const monthly = calculateEstimatedYield(sampleAmount, product.apy, 30);
  const sixMonth = calculateEstimatedYield(sampleAmount, product.apy, 180);
  const yearly = calculateEstimatedYield(sampleAmount, product.apy, 365);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>상품 상세</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 상품 제목 영역 */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <View style={[styles.productIcon, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.productIconText, { color: colors.primary }]}>
                {product.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {product.displayName}
              </Text>
              <Text style={[styles.productSubname, { color: colors.textMuted }]}>
                {product.name}
              </Text>
            </View>
          </View>
        </View>

        {/* APY 카드 */}
        <Card variant="dark" style={styles.apyCard}>
          <View style={styles.apyRow}>
            <View style={styles.apyItem}>
              <Text style={[styles.apyLabel, { color: colors.textMuted }]}>연 수익률 (APY)</Text>
              <Text style={[styles.apyValue, { color: colors.primary }]}>
                {formatPercentage(product.apy)}
              </Text>
            </View>
            <View style={[styles.apyDivider, { backgroundColor: colors.border }]} />
            <View style={styles.apyItem}>
              <Text style={[styles.apyLabel, { color: colors.textMuted }]}>유형</Text>
              <Text style={[styles.typeValue, { color: colors.textPrimary }]}>
                {product.type === 'flexible' ? '자유 출금' : `${product.lockupDays}일 락업`}
              </Text>
            </View>
          </View>
        </Card>

        {/* 쉽게 이해하는 상품 설명 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>이 상품은 어떻게 작동하나요?</Text>
          <Card variant="dark" style={styles.explainCard}>
            <ExplainStep
              title={`${product.depositToken} 예치`}
              description={`보유한 ${product.depositToken}를 예치합니다`}
              icon="wallet-outline"
            />
            <View style={[styles.stepArrow, { backgroundColor: colors.border }]} />
            <ExplainStep
              title={`${product.receiveToken} 토큰 수령`}
              description={`예치한 만큼 ${product.receiveToken} 토큰을 받습니다`}
              icon="swap-horizontal-outline"
            />
            <View style={[styles.stepArrow, { backgroundColor: colors.border }]} />
            <ExplainStep
              title="자동으로 수익 발생"
              description={`${product.receiveToken} 토큰 가치가 매일 조금씩 올라갑니다`}
              icon="trending-up-outline"
            />
          </Card>
        </View>

        {/* 핵심 특징 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>핵심 특징</Text>
          <View style={styles.featuresGrid}>
            {product.features.map((feature, index) => (
              <Card key={index} variant="dark" style={styles.featureCard}>
                <Ionicons
                  name={feature.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{feature.description}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* 예상 수익 시뮬레이션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            예상 수익 (1,000 {product.depositToken} 예치 시)
          </Text>
          <Card variant="dark" style={styles.simCard}>
            <SimRow period="1개월 후" amount={monthly} token={product.depositToken} />
            <SimRow period="6개월 후" amount={sixMonth} token={product.depositToken} />
            <SimRow period="1년 후" amount={yearly} token={product.depositToken} isLast />
          </Card>
          <Text style={[styles.simNote, { color: colors.textMuted }]}>
            * 예상 수익은 현재 APY 기준이며, 실제 수익과 다를 수 있습니다
          </Text>
        </View>

        {/* 상품 정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>상품 정보</Text>
          <DetailRow label="예치 자산" value={product.depositToken} />
          <DetailRow label="수령 토큰" value={product.receiveToken} />
          <DetailRow label="수익 방식" value="토큰 가격 상승 (자동 복리)" />
          {product.priceUpdateFrequency && (
            <DetailRow label="가격 업데이트" value={product.priceUpdateFrequency} />
          )}
          <DetailRow
            label="출금"
            value={product.type === 'flexible' ? '자유 출금 가능' : `${product.lockupDays}일 후 출금`}
          />
          <DetailRow label="네트워크" value={product.networks.join(', ')} />
          {product.riskManager && (
            <DetailRow label="리스크 매니저" value={product.riskManager} />
          )}
          {product.custody && (
            <DetailRow label="수탁 보안" value={product.custody} />
          )}
        </View>

        {/* 리스크 고지 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>알아두세요</Text>
          <Card variant="dark" style={styles.riskCard}>
            <View style={styles.riskRow}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
              <Text style={[styles.riskText, { color: colors.textSecondary }]}>
                투자 원금의 손실이 발생할 수 있으며, 과거 수익률이 미래 수익을 보장하지 않습니다.
              </Text>
            </View>
            {product.type === 'locked' && (
              <View style={styles.riskRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.warning} />
                <Text style={[styles.riskText, { color: colors.textSecondary }]}>
                  {product.lockupDays}일 락업 기간 중에는 출금이 제한됩니다.
                </Text>
              </View>
            )}
            {product.instantLiquidity && (
              <View style={styles.riskRow}>
                <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.riskText, { color: colors.textSecondary }]}>
                  출금은 요청 후 최대 3영업일이 소요될 수 있습니다. 일부 금액은 즉시 출금도 가능합니다.
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* 컨트랙트 정보 */}
        <View style={styles.section}>
          <Text
            style={[styles.contractLink, { color: colors.textMuted }]}
            onPress={() => Linking.openURL(`https://etherscan.io/address/${product.contractAddress}`)}
          >
            스마트 컨트랙트 보기 →
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 하단 CTA */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <PrimaryButton title="예치하기" onPress={onDeposit} />
      </View>
    </SafeAreaView>
  );
}

function ExplainStep({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepNumber, { backgroundColor: colors.primaryBg }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.stepDesc, { color: colors.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function SimRow({ period, amount, token, isLast }: { period: string; amount: number; token: string; isLast?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.simRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.simPeriod, { color: colors.textSecondary }]}>{period}</Text>
      <Text style={[styles.simAmount, { color: colors.primary }]}>+{formatUSD(amount)} {token}</Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  titleContainer: {
    gap: 4,
  },
  productName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  productSubname: {
    fontSize: 14,
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
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  typeValue: {
    fontSize: 18,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  explainCard: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  stepDesc: {
    fontSize: 13,
  },
  stepArrow: {
    width: 2,
    height: 16,
    marginLeft: 19,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureCard: {
    width: '48%',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  simCard: {
    paddingVertical: 4,
  },
  simRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  simPeriod: {
    fontSize: 14,
  },
  simAmount: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  simNote: {
    fontSize: 11,
    marginTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
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
  contractLink: {
    fontSize: 13,
    textDecorationLine: 'underline',
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
