import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Card } from '../../components/common';

export default function ExchangeScreen() {
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.content}>
        {/* 헤더 */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>환전</Text>

        {/* 서비스 준비 중 카드 */}
        <Card variant="dark" style={styles.comingSoonCard}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="swap-horizontal" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.comingSoonTitle, { color: colors.textPrimary }]}>
            서비스 준비 중
          </Text>

          <Text style={[styles.comingSoonDescription, { color: colors.textSecondary }]}>
            원화(KRW)와 스테이블코인 간의{'\n'}간편한 환전 서비스를 준비하고 있습니다.
          </Text>

          {/* 예정 기능 목록 */}
          <View style={styles.featureList}>
            <FeatureItem
              icon="cash-outline"
              title="원화 ↔ USDC 환전"
              description="은행 계좌에서 바로 환전"
            />
            <FeatureItem
              icon="trending-down-outline"
              title="낮은 수수료"
              description="업계 최저 수준의 환전 수수료"
            />
            <FeatureItem
              icon="flash-outline"
              title="빠른 처리"
              description="실시간 환전 및 즉시 입금"
            />
          </View>

          {/* 알림 신청 안내 */}
          <View style={[styles.notifyBox, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="notifications-outline" size={18} color={colors.primary} />
            <Text style={[styles.notifyText, { color: colors.textSecondary }]}>
              서비스 오픈 시 알림을 받으시려면{'\n'}설정에서 푸시 알림을 켜주세요.
            </Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const colors = useColors();

  return (
    <View style={featureStyles.container}>
      <View style={[featureStyles.iconBox, { backgroundColor: colors.surfaceLight }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={featureStyles.textContainer}>
        <Text style={[featureStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[featureStyles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  comingSoonCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  comingSoonDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  featureList: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  notifyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  notifyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
