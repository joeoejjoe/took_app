import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, BackButton, Card } from '../../components/common';
import { useKycStore } from '../../store/useKycStore';

interface KycScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

type KycStep = 'intro' | 'identity' | 'submitting' | 'done';

export default function KycScreen({ onBack, onComplete }: KycScreenProps) {
  const colors = useColors();
  const [step, setStep] = useState<KycStep>('intro');
  const [selectedIdType, setSelectedIdType] = useState<string | null>(null);
  const { submitKyc, setStatus } = useKycStore();

  const handleStartKyc = () => {
    setStep('identity');
  };

  const handleSubmit = () => {
    setStep('submitting');
    submitKyc();

    // Mock: KYC 승인 시뮬레이션
    setTimeout(() => {
      setStatus('verified');
      setStep('done');
    }, 2000);
  };

  const handleDone = () => {
    onComplete();
  };

  if (step === 'done') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContent}>
          <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={48} color={colors.buttonPrimaryText} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>인증 완료!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            KYC 인증이 완료되었습니다.{'\n'}이제 출금을 진행할 수 있습니다.
          </Text>
          <PrimaryButton
            title="출금 계속하기"
            onPress={handleDone}
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'submitting') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContent}>
          <View style={[styles.loadingCircle, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="document-text" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>인증 진행 중...</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
            제출한 정보를 확인하고 있습니다.{'\n'}잠시만 기다려 주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'identity') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => setStep('intro')} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>본인 인증</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>신분증을 선택해 주세요</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
            본인 확인을 위해 신분증 종류를 선택해 주세요.
          </Text>

          <View style={styles.idTypeList}>
            {[
              { key: 'resident', label: '주민등록증', icon: 'card-outline' as const },
              { key: 'driver', label: '운전면허증', icon: 'car-outline' as const },
              { key: 'passport', label: '여권', icon: 'airplane-outline' as const },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.idTypeRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedIdType === item.key && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                ]}
                onPress={() => setSelectedIdType(item.key)}
              >
                <View style={[
                  styles.idTypeIcon,
                  { backgroundColor: colors.surfaceLight },
                  selectedIdType === item.key && { backgroundColor: 'rgba(74, 222, 128, 0.15)' },
                ]}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={selectedIdType === item.key ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text style={[
                  styles.idTypeLabel,
                  { color: colors.textSecondary },
                  selectedIdType === item.key && { color: colors.textPrimary, fontWeight: FontWeight.semibold },
                ]}>
                  {item.label}
                </Text>
                {selectedIdType === item.key && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedIdType && (
            <Card variant="dark" style={styles.uploadCard}>
              <TouchableOpacity style={[styles.uploadArea, { borderColor: colors.border }]}>
                <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.uploadText, { color: colors.textPrimary }]}>신분증 사진 촬영</Text>
                <Text style={[styles.uploadHint, { color: colors.textMuted }]}>탭하여 카메라를 실행합니다</Text>
              </TouchableOpacity>
            </Card>
          )}
        </ScrollView>

        <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
          <PrimaryButton
            title="제출하기"
            onPress={handleSubmit}
            disabled={!selectedIdType}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Intro step
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>KYC 인증</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.introIcon}>
          <Ionicons name="shield-checkmark-outline" size={60} color={colors.primary} />
        </View>

        <Text style={[styles.introTitle, { color: colors.textPrimary }]}>본인 인증이 필요합니다</Text>
        <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
          출금을 위해 한 번만 본인 인증을 진행해 주세요.{'\n'}
          인증은 안전하게 처리됩니다.
        </Text>

        <Card variant="dark" style={styles.infoCard}>
          <InfoRow
            icon="document-text-outline"
            title="신분증 확인"
            description="주민등록증, 운전면허증, 또는 여권"
          />
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon="time-outline"
            title="빠른 인증"
            description="실시간으로 인증이 처리됩니다"
          />
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon="lock-closed-outline"
            title="안전한 처리"
            description="개인정보는 암호화되어 안전하게 보호됩니다"
          />
        </Card>

        <Card variant="dark" style={styles.noticeCard}>
          <View style={styles.noticeRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              KYC 인증은 최초 출금 시 한 번만 진행하면 됩니다.
            </Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
        <PrimaryButton title="인증 시작하기" onPress={handleStartKyc} />
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
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
    <View style={styles.infoRow}>
      <View style={[styles.infoRowIcon, { backgroundColor: colors.primaryBg }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoRowText}>
        <Text style={[styles.infoRowTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.infoRowDesc, { color: colors.textMuted }]}>{description}</Text>
      </View>
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
    paddingHorizontal: Spacing.lg,
  },
  // Intro
  introIcon: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  introSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    marginBottom: Spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowText: {
    flex: 1,
    gap: 2,
  },
  infoRowTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  infoRowDesc: {
    fontSize: 12,
  },
  infoDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  noticeCard: {
    marginBottom: Spacing.xl,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Identity step
  stepTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  idTypeList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  idTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    gap: Spacing.md,
    borderWidth: 1,
  },
  idTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idTypeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: FontWeight.medium,
  },
  uploadCard: {
    marginBottom: Spacing.xl,
  },
  uploadArea: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  uploadHint: {
    fontSize: 12,
  },
  // Center content (loading/success)
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  successTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
  },
  successButton: {
    width: '100%',
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Bottom
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: 1,
  },
});
