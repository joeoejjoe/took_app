import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';

interface TermsScreenProps {
  onBack: () => void;
}

export default function TermsScreen({ onBack }: TermsScreenProps) {
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>이용약관</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
          최종 업데이트: 2024년 2월 1일
        </Text>

        <Section title="제1조 (목적)" colors={colors}>
          본 약관은 TOOK(이하 "회사")가 제공하는 스테이블코인 예치 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </Section>

        <Section title="제2조 (정의)" colors={colors}>
          {`1. "서비스"란 회사가 제공하는 스테이블코인 예치 및 수익 관리 플랫폼을 의미합니다.
2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 의미합니다.
3. "지갑"이란 이용자의 디지털 자산을 보관하는 블록체인 주소를 의미합니다.
4. "예치"란 이용자가 자신의 디지털 자산을 회사가 제공하는 스마트 컨트랙트에 맡기는 행위를 의미합니다.`}
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)" colors={colors}>
          {`1. 본 약관은 이용자가 동의함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.
3. 약관이 변경되는 경우 회사는 변경 내용을 서비스 내 공지합니다.`}
        </Section>

        <Section title="제4조 (서비스의 제공)" colors={colors}>
          {`회사는 다음과 같은 서비스를 제공합니다:
1. 스테이블코인 예치 서비스
2. 예치에 따른 수익(이자) 제공
3. 자산 현황 조회 서비스
4. 기타 회사가 정하는 서비스`}
        </Section>

        <Section title="제5조 (이용자의 의무)" colors={colors}>
          {`이용자는 다음 행위를 하여서는 안 됩니다:
1. 타인의 정보 도용
2. 회사의 서비스 운영을 방해하는 행위
3. 불법적인 목적으로 서비스를 이용하는 행위
4. 기타 관련 법령에 위반되는 행위`}
        </Section>

        <Section title="제6조 (책임의 제한)" colors={colors}>
          {`1. 회사는 천재지변, 전쟁, 기타 불가항력적인 사유로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.
2. 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
3. 블록체인 네트워크의 특성상 발생하는 지연, 오류에 대해 회사는 책임을 지지 않습니다.`}
        </Section>

        <Section title="제7조 (디지털 자산의 위험)" colors={colors}>
          {`1. 디지털 자산의 가격은 변동될 수 있으며, 이로 인한 손실에 대해 회사는 책임을 지지 않습니다.
2. 스마트 컨트랙트의 기술적 위험이 존재할 수 있습니다.
3. 이용자는 서비스 이용 전 관련 위험을 충분히 이해해야 합니다.`}
        </Section>

        <Section title="제8조 (분쟁 해결)" colors={colors}>
          {`1. 서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 해결합니다.
2. 협의가 이루어지지 않을 경우, 관할 법원에 소를 제기할 수 있습니다.`}
        </Section>

        <Section title="부칙" colors={colors}>
          본 약관은 2024년 2월 1일부터 시행됩니다.
        </Section>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            문의: support@took.app
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{children}</Text>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  lastUpdated: {
    fontSize: 12,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
