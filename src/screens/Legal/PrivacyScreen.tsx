import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';

interface PrivacyScreenProps {
  onBack: () => void;
}

export default function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>개인정보처리방침</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
          최종 업데이트: 2024년 2월 1일
        </Text>

        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          TOOK(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며, 개인정보보호법 등 관련 법령을 준수합니다.
        </Text>

        <Section title="1. 수집하는 개인정보" colors={colors}>
          {`회사는 서비스 제공을 위해 다음 정보를 수집합니다:

[필수 정보]
• 이메일 주소
• 지갑 주소 (블록체인 공개 주소)

[선택 정보]
• 닉네임
• 프로필 정보

[자동 수집 정보]
• 서비스 이용 기록
• 접속 로그
• 기기 정보`}
        </Section>

        <Section title="2. 개인정보의 이용 목적" colors={colors}>
          {`수집된 개인정보는 다음 목적으로 이용됩니다:

• 서비스 제공 및 운영
• 이용자 식별 및 본인 확인
• 서비스 개선 및 신규 서비스 개발
• 고객 문의 응대
• 서비스 관련 공지사항 전달`}
        </Section>

        <Section title="3. 개인정보의 보관 기간" colors={colors}>
          {`회사는 이용자의 개인정보를 서비스 이용 기간 동안 보관합니다.

• 회원 탈퇴 시: 즉시 파기
• 관련 법령에 따른 보관이 필요한 경우: 해당 기간 동안 보관

[법령에 따른 보관 기간]
• 계약 또는 청약철회 기록: 5년
• 소비자 불만 또는 분쟁 처리 기록: 3년
• 접속 로그: 3개월`}
        </Section>

        <Section title="4. 개인정보의 제3자 제공" colors={colors}>
          {`회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.

다만, 다음의 경우에는 예외로 합니다:
• 이용자가 사전에 동의한 경우
• 법령에 의해 요구되는 경우`}
        </Section>

        <Section title="5. 개인정보의 안전성 확보 조치" colors={colors}>
          {`회사는 개인정보의 안전성 확보를 위해 다음 조치를 취합니다:

• 개인정보 암호화
• 해킹 등에 대비한 기술적 대책
• 개인정보 접근 권한 관리
• 개인정보 취급 직원의 최소화 및 교육`}
        </Section>

        <Section title="6. 이용자의 권리" colors={colors}>
          {`이용자는 다음과 같은 권리를 행사할 수 있습니다:

• 개인정보 열람 요구
• 개인정보 정정·삭제 요구
• 개인정보 처리정지 요구
• 동의 철회

권리 행사는 앱 내 설정 또는 고객센터를 통해 가능합니다.`}
        </Section>

        <Section title="7. 쿠키의 사용" colors={colors}>
          {`회사는 서비스 이용 편의를 위해 쿠키를 사용할 수 있습니다.

• 쿠키란: 웹사이트가 이용자의 기기에 저장하는 작은 텍스트 파일
• 사용 목적: 로그인 유지, 서비스 이용 편의 제공
• 거부 방법: 브라우저 설정에서 쿠키 저장 거부 가능`}
        </Section>

        <Section title="8. 개인정보 보호책임자" colors={colors}>
          {`개인정보 보호책임자
• 이메일: privacy@took.app

개인정보 처리와 관련한 문의, 불만, 피해구제 등은 위 연락처로 문의해 주시기 바랍니다.`}
        </Section>

        <Section title="9. 개인정보처리방침의 변경" colors={colors}>
          본 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 변경될 수 있습니다. 변경 시 앱 내 공지를 통해 안내드립니다.
        </Section>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            문의: privacy@took.app
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
  intro: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.xl,
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
