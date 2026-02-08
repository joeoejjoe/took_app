import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
  Linking,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { Card, ToggleButton } from '../../components/common';
import { useAuthStore } from '../../store/useAuthStore';
import { useKycStore } from '../../store/useKycStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useColors } from '../../hooks/useColors';
import { getExplorerAddressUrl, getUserBlockchainDeposits, BlockchainDeposit } from '../../services';
import { formatUSD } from '../../utils/format';
import TermsScreen from '../Legal/TermsScreen';
import PrivacyScreen from '../Legal/PrivacyScreen';
import DepositScreen from './DepositScreen';
import WithdrawScreen from './WithdrawScreen';

export default function MyScreen() {
  const { userProfile, walletAddress, signOut, updateNickname } = useAuthStore();
  const kycStatus = useKycStore((s) => s.status);
  const { mode, toggleTheme } = useThemeStore();
  const colors = useColors();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [deposits, setDeposits] = useState<BlockchainDeposit[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const displayEmail = userProfile?.email || 'user@took.app';
  const displayName = userProfile?.displayName || '닉네임을 설정해주세요';
  const isDark = mode === 'dark';
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  // 총 자산 계산
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);

  // 예치 내역 로드
  const loadDeposits = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const userDeposits = await getUserBlockchainDeposits(walletAddress);
      setDeposits(userDeposits);
    } catch (error) {
      console.error('Failed to load deposits:', error);
    }
  }, [walletAddress]);

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadDeposits();
    }, [loadDeposits])
  );

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeposits();
    setRefreshing(false);
  };

  const handleWalletPress = () => {
    setShowWalletModal(true);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Share.share({
        message: text,
      });
    } catch {
      Alert.alert(label, text);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleEditNickname = () => {
    setNicknameInput(userProfile?.displayName || '');
    setShowNicknameModal(true);
  };

  const handleSaveNickname = async () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      Alert.alert('알림', '닉네임은 2~20자로 입력해주세요.');
      return;
    }

    setIsSavingNickname(true);
    try {
      await updateNickname(trimmed);
      setShowNicknameModal(false);
      Alert.alert('완료', '닉네임이 변경되었습니다.');
    } catch (error) {
      Alert.alert('오류', '닉네임 변경에 실패했습니다.');
    } finally {
      setIsSavingNickname(false);
    }
  };

  // 입금 화면
  if (showDeposit) {
    return <DepositScreen onBack={() => setShowDeposit(false)} />;
  }

  // 출금 화면
  if (showWithdraw) {
    return <WithdrawScreen onBack={() => setShowWithdraw(false)} />;
  }

  // 이용약관 화면
  if (showTerms) {
    return <TermsScreen onBack={() => setShowTerms(false)} />;
  }

  // 개인정보처리방침 화면
  if (showPrivacy) {
    return <PrivacyScreen onBack={() => setShowPrivacy(false)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>내 정보</Text>

        {/* Profile Card */}
        <Card variant="dark" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="person" size={28} color={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <TouchableOpacity style={styles.nicknameRow} onPress={handleEditNickname}>
                <Text
                  style={[
                    styles.profileName,
                    { color: userProfile?.displayName ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  {displayName}
                </Text>
                <Ionicons name="pencil" size={14} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{displayEmail}</Text>
              {shortAddress && (
                <TouchableOpacity
                  style={styles.addressRow}
                  onPress={() => copyToClipboard(walletAddress!, '지갑 주소')}
                >
                  <Ionicons name="wallet" size={12} color={colors.primary} />
                  <Text style={[styles.addressText, { color: colors.primary }]}>{shortAddress}</Text>
                  <Ionicons name="copy-outline" size={12} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        {/* Asset Summary */}
        <Card variant="dark" style={styles.assetCard}>
          <View style={styles.assetHeader}>
            <Text style={[styles.assetLabel, { color: colors.textMuted }]}>총 예치 자산</Text>
            <TouchableOpacity>
              <Ionicons name="eye-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.assetAmount, { color: colors.textPrimary }]}>
            ${formatUSD(totalDeposited)}
          </Text>
          <View style={styles.assetStats}>
            <View style={styles.assetStatItem}>
              <Text style={[styles.assetStatLabel, { color: colors.textMuted }]}>예치 상품</Text>
              <Text style={[styles.assetStatValue, { color: colors.textPrimary }]}>{deposits.length}개</Text>
            </View>
            <View style={[styles.assetStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.assetStatItem}>
              <Text style={[styles.assetStatLabel, { color: colors.textMuted }]}>지갑 상태</Text>
              <Text style={[styles.assetStatValue, { color: walletAddress ? colors.primary : colors.warning }]}>
                {walletAddress ? '연결됨' : '미연결'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="download-outline"
            label="입금하기"
            colors={colors}
            onPress={() => setShowDeposit(true)}
          />
          <QuickActionButton
            icon="arrow-up-outline"
            label="출금하기"
            colors={colors}
            onPress={() => setShowWithdraw(true)}
          />
          <QuickActionButton
            icon="share-outline"
            label="친구 초대"
            colors={colors}
            onPress={() => Share.share({ message: 'TOOK - 스테이블코인 예치 플랫폼\nhttps://took.app' })}
          />
        </View>

        {/* Transaction History Button */}
        <TouchableOpacity
          style={[styles.historyButton, { backgroundColor: colors.surface }]}
          onPress={() => Alert.alert('알림', '거래 내역 기능은 준비 중입니다.')}
          activeOpacity={0.7}
        >
          <View style={styles.historyLeft}>
            <View style={[styles.historyIcon, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.historyLabel, { color: colors.textPrimary }]}>거래 내역</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>계정</Text>
        <Card variant="dark" style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleWalletPress}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>지갑 관리</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={[styles.menuValue, { color: walletAddress ? colors.primary : colors.warning }]}>
                {walletAddress ? shortAddress : '미연결'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="shield-checkmark-outline"
            iconColor="#10B981"
            label="KYC 인증"
            value={kycStatus === 'verified' ? '인증 완료' : '미인증'}
            valueColor={kycStatus === 'verified' ? colors.primary : colors.warning}
            colors={colors}
            onPress={() => Alert.alert('알림', 'KYC 인증 기능은 준비 중입니다.')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="card-outline"
            iconColor="#8B5CF6"
            label="결제 수단"
            value="미등록"
            colors={colors}
            onPress={() => Alert.alert('알림', '결제 수단 등록 기능은 준비 중입니다.')}
          />
        </Card>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>설정</Text>
        <Card variant="dark" style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>푸시 알림</Text>
            </View>
            <ToggleButton value={pushEnabled} onToggle={setPushEnabled} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="language-outline"
            iconColor="#3B82F6"
            label="언어"
            value="한국어"
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#6366F120' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="#6366F1" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>다크 모드</Text>
            </View>
            <ToggleButton value={isDark} onToggle={toggleTheme} />
          </View>
        </Card>

        {/* Info Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>정보</Text>
        <Card variant="dark" style={styles.menuCard}>
          <MenuItem
            icon="document-text-outline"
            iconColor="#64748B"
            label="이용약관"
            colors={colors}
            onPress={() => setShowTerms(true)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="lock-closed-outline"
            iconColor="#64748B"
            label="개인정보처리방침"
            colors={colors}
            onPress={() => setShowPrivacy(true)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="help-circle-outline"
            iconColor="#64748B"
            label="고객센터"
            colors={colors}
            onPress={() => Linking.openURL('mailto:support@took.app')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="information-circle-outline"
            iconColor="#64748B"
            label="앱 버전"
            value="1.0.0"
            colors={colors}
            showArrow={false}
          />
        </Card>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.textRed} />
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
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
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
                  <Text style={[styles.walletLabel, { color: colors.textMuted }]}>지갑 주소</Text>
                  <Text style={[styles.walletAddress, { color: colors.textPrimary }]}>
                    {walletAddress}
                  </Text>
                  <View style={styles.walletActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primaryBg }]}
                      onPress={() => copyToClipboard(walletAddress, '지갑 주소')}
                    >
                      <Ionicons name="copy-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>복사</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primaryBg }]}
                      onPress={() => Linking.openURL(getExplorerAddressUrl(walletAddress))}
                    >
                      <Ionicons name="open-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>탐색기</Text>
                    </TouchableOpacity>
                  </View>
                </Card>

                {/* Balance Info */}
                <Card variant="dark" style={styles.walletCard}>
                  <Text style={[styles.walletLabel, { color: colors.textMuted }]}>예치 현황</Text>
                  <View style={styles.balanceRow}>
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>총 예치금</Text>
                    <Text style={[styles.balanceValue, { color: colors.primary }]}>
                      ${formatUSD(totalDeposited)}
                    </Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>예치 상품 수</Text>
                    <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>
                      {deposits.length}개
                    </Text>
                  </View>
                </Card>

                {/* MPC Wallet Security Info */}
                <Card variant="dark" style={styles.walletCard}>
                  <View style={styles.securityHeader}>
                    <Text style={[styles.walletLabel, { color: colors.textMuted }]}>지갑 보안</Text>
                    <View style={[styles.securityBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                      <Text style={[styles.securityBadgeText, { color: colors.primary }]}>MPC 보호</Text>
                    </View>
                  </View>
                  <View style={[styles.mpcWalletInfo, { backgroundColor: colors.surfaceLight }]}>
                    <Ionicons name="lock-closed" size={28} color={colors.primary} />
                    <Text style={[styles.mpcWalletTitle, { color: colors.textPrimary }]}>
                      MPC 보안 지갑
                    </Text>
                    <Text style={[styles.mpcWalletText, { color: colors.textSecondary }]}>
                      회원님의 지갑은 MPC(다자간 연산) 기술로{'\n'}
                      보호됩니다. 프라이빗 키가 여러 서버에{'\n'}
                      분산 저장되어 단일 지점 공격이 불가능합니다.
                    </Text>
                  </View>
                </Card>

                {/* Security Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.primaryBg }]}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
                    이메일 인증으로 언제든지 지갑에 접근할 수 있으며,{'\n'}
                    Privy의 보안 인프라로 자산이 안전하게 보호됩니다.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noWallet}>
                <View style={[styles.noWalletIcon, { backgroundColor: colors.surfaceLight }]}>
                  <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
                </View>
                <Text style={[styles.noWalletTitle, { color: colors.textPrimary }]}>
                  연결된 지갑이 없습니다
                </Text>
                <Text style={[styles.noWalletText, { color: colors.textSecondary }]}>
                  지갑을 연결하면 자산을 예치하고{'\n'}수익을 받을 수 있습니다.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Nickname Edit Modal */}
      <Modal
        visible={showNicknameModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNicknameModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowNicknameModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>닉네임 변경</Text>
            <TouchableOpacity onPress={handleSaveNickname} disabled={isSavingNickname}>
              <Text
                style={[
                  styles.modalSaveText,
                  { color: isSavingNickname ? colors.textMuted : colors.primary },
                ]}
              >
                {isSavingNickname ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nicknameContent}>
            <Text style={[styles.nicknameLabel, { color: colors.textSecondary }]}>
              리더보드에 표시될 닉네임을 설정하세요
            </Text>
            <TextInput
              style={[
                styles.nicknameInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="닉네임 입력 (2~20자)"
              placeholderTextColor={colors.textMuted}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              maxLength={20}
              autoFocus
            />
            <Text style={[styles.nicknameHint, { color: colors.textMuted }]}>
              {nicknameInput.length}/20
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function QuickActionButton({
  icon,
  label,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickActionItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryBg }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenuItem({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  colors,
  onPress,
  showArrow = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  valueColor?: string;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
  showArrow?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconBg, { backgroundColor: (iconColor || colors.textSecondary) + '20' }]}>
          <Ionicons name={icon} size={18} color={iconColor || colors.textSecondary} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && (
          <Text style={[styles.menuValue, { color: valueColor || colors.textMuted }]}>
            {value}
          </Text>
        )}
        {showArrow && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
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
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileEmail: {
    fontSize: 13,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  // Asset Card
  assetCard: {
    marginBottom: Spacing.md,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  assetLabel: {
    fontSize: 13,
  },
  assetAmount: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  assetStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  assetStatDivider: {
    width: 1,
    height: 30,
  },
  assetStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  assetStatValue: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  // History Button
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLabel: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  menuCard: {
    marginBottom: Spacing.lg,
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
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  logoutText: {
    fontSize: 15,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  nicknameContent: {
    padding: Spacing.lg,
  },
  nicknameLabel: {
    fontSize: 14,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  nicknameInput: {
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    textAlign: 'center',
  },
  nicknameHint: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: Spacing.xs,
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
  walletActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  securityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  noWallet: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  noWalletIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  noWalletTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  noWalletText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  // MPC Wallet Info
  mpcWalletInfo: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  mpcWalletTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xs,
  },
  mpcWalletText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
