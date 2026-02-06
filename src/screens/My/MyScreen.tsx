import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing } from '../../constants';
import { Card, ToggleButton } from '../../components/common';
import { useAuthStore } from '../../store/useAuthStore';
import { useKycStore } from '../../store/useKycStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useColors } from '../../hooks/useColors';
import { getStoredWallet } from '../../services';

export default function MyScreen() {
  const { userProfile, walletAddress, signOut } = useAuthStore();
  const kycStatus = useKycStore((s) => s.status);
  const { mode, toggleTheme } = useThemeStore();
  const colors = useColors();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const displayEmail = userProfile?.email || 'user@took.app';
  const isDark = mode === 'dark';

  // 지갑 정보 로드
  const loadWalletInfo = async () => {
    const wallet = await getStoredWallet();
    if (wallet) {
      setPrivateKey(wallet.privateKey);
    }
  };

  const handleWalletPress = () => {
    loadWalletInfo();
    setShowWalletModal(true);
    setShowPrivateKey(false);
  };

  const shareText = async (text: string, label: string) => {
    try {
      await Share.share({
        message: text,
        title: label,
      });
    } catch (error) {
      Alert.alert(label, text);
    }
  };

  const handleShowPrivateKey = () => {
    Alert.alert(
      '주의',
      '프라이빗 키는 절대 다른 사람에게 공유하지 마세요.\n\n프라이빗 키가 노출되면 자산을 잃을 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: () => setShowPrivateKey(true) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>내 정보</Text>

        {/* Profile Card */}
        <Card variant="dark" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="person" size={28} color={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>TOOK 사용자</Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{displayEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>계정</Text>
        <Card variant="dark" style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleWalletPress}>
            <View style={styles.menuLeft}>
              <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>지갑 관리</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={[styles.menuValue, { color: walletAddress ? colors.primary : colors.warning }]}>
                {walletAddress ? '연결됨' : '미연결'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="shield-checkmark-outline"
            label="KYC 인증"
            value={kycStatus === 'verified' ? '인증 완료' : '미인증'}
            valueColor={kycStatus === 'verified' ? colors.primary : colors.warning}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="card-outline" label="결제 수단" value="미등록" colors={colors} />
        </Card>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>설정</Text>
        <Card variant="dark" style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>푸시 알림</Text>
            </View>
            <ToggleButton value={pushEnabled} onToggle={setPushEnabled} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="language-outline" label="언어" value="한국어" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.textSecondary} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>다크 모드</Text>
            </View>
            <ToggleButton value={isDark} onToggle={toggleTheme} />
          </View>
        </Card>

        {/* Info Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>정보</Text>
        <Card variant="dark" style={styles.menuCard}>
          <MenuItem icon="document-text-outline" label="이용약관" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="lock-closed-outline" label="개인정보처리방침" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="help-circle-outline" label="고객센터" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="information-circle-outline" label="앱 버전" value="1.0.0" colors={colors} />
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={[styles.logoutText, { color: colors.textRed }]}>로그아웃</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Wallet Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>지갑 관리</Text>
            <TouchableOpacity onPress={() => setShowWalletModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {walletAddress ? (
              <>
                {/* Wallet Address */}
                <Card variant="dark" style={styles.walletCard}>
                  <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>지갑 주소</Text>
                  <Text style={[styles.walletAddress, { color: colors.textPrimary }]}>
                    {walletAddress}
                  </Text>
                  <TouchableOpacity
                    style={[styles.copyButton, { backgroundColor: colors.primaryBg }]}
                    onPress={() => shareText(walletAddress, '지갑 주소')}
                  >
                    <Ionicons name="share-outline" size={16} color={colors.primary} />
                    <Text style={[styles.copyButtonText, { color: colors.primary }]}>주소 공유/복사</Text>
                  </TouchableOpacity>
                </Card>

                {/* Private Key */}
                {privateKey && (
                  <Card variant="dark" style={styles.walletCard}>
                    <View style={styles.privateKeyHeader}>
                      <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>프라이빗 키</Text>
                      <View style={[styles.warningBadge, { backgroundColor: colors.warning + '20' }]}>
                        <Ionicons name="warning" size={12} color={colors.warning} />
                        <Text style={[styles.warningText, { color: colors.warning }]}>비공개</Text>
                      </View>
                    </View>

                    {showPrivateKey ? (
                      <>
                        <Text style={[styles.privateKeyText, { color: colors.textPrimary }]}>
                          {privateKey}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyButton, { backgroundColor: colors.primaryBg }]}
                          onPress={() => shareText(privateKey, '프라이빗 키')}
                        >
                          <Ionicons name="share-outline" size={16} color={colors.primary} />
                          <Text style={[styles.copyButtonText, { color: colors.primary }]}>프라이빗 키 공유/복사</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.hideButton}
                          onPress={() => setShowPrivateKey(false)}
                        >
                          <Text style={[styles.hideButtonText, { color: colors.textSecondary }]}>숨기기</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[styles.revealButton, { borderColor: colors.warning }]}
                        onPress={handleShowPrivateKey}
                      >
                        <Ionicons name="eye-outline" size={18} color={colors.warning} />
                        <Text style={[styles.revealButtonText, { color: colors.warning }]}>
                          프라이빗 키 보기
                        </Text>
                      </TouchableOpacity>
                    )}
                  </Card>
                )}

                {/* Warning */}
                <View style={[styles.warningCard, { backgroundColor: colors.warning + '10' }]}>
                  <Ionicons name="alert-circle" size={20} color={colors.warning} />
                  <Text style={[styles.warningCardText, { color: colors.warning }]}>
                    프라이빗 키는 절대 다른 사람에게 공유하지 마세요. 프라이빗 키가 노출되면 자산을 잃을 수 있습니다.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noWallet}>
                <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.noWalletText, { color: colors.textSecondary }]}>
                  연결된 지갑이 없습니다.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  value,
  valueColor,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  valueColor?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && (
          <Text style={[styles.menuValue, { color: valueColor || colors.textMuted }]}>
            {value}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  profileCard: {
    marginBottom: Spacing.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
  },
  profileEmail: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  menuCard: {
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuLabel: {
    fontSize: 15,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  walletCard: {
    marginBottom: Spacing.md,
  },
  walletLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  privateKeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  warningText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  privateKeyText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  hideButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  hideButtonText: {
    fontSize: 13,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  revealButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: 8,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  warningCardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  noWallet: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  noWalletText: {
    fontSize: 15,
  },
});
