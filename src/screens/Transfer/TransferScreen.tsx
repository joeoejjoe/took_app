import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { useKycStore } from '../../store/useKycStore';
import KycScreen from './KycScreen';
import WithdrawScreen from './WithdrawScreen';

type TabType = 'favorites' | 'recent';

interface Recipient {
  id: string;
  name: string;
  bank: string;
  account: string;
  isFavorite: boolean;
  iconColor: string;
}

const MOCK_RECIPIENTS: Recipient[] = [
  {
    id: '1',
    name: '홍길동',
    bank: '토스뱅크',
    account: '01234567890123',
    isFavorite: true,
    iconColor: '#4ADE80',
  },
  {
    id: '2',
    name: '홍길동',
    bank: '토스뱅크',
    account: '01234567890123',
    isFavorite: true,
    iconColor: '#3B82F6',
  },
];

const MOCK_RECENT: Recipient[] = [
  {
    id: '3',
    name: '홍길동',
    bank: '토스뱅크',
    account: '01234567890123',
    isFavorite: false,
    iconColor: '#4ADE80',
  },
  {
    id: '4',
    name: '홍길동',
    bank: '토스뱅크',
    account: '01234567890123',
    isFavorite: false,
    iconColor: '#3B82F6',
  },
];

export default function TransferScreen() {
  const colors = useColors();
  const [address, setAddress] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [recipients, setRecipients] = useState(MOCK_RECIPIENTS);
  const [showKyc, setShowKyc] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const kycStatus = useKycStore((s) => s.status);

  const displayList = activeTab === 'favorites'
    ? recipients.filter((r) => r.isFavorite)
    : MOCK_RECENT;

  const handleToggleFavorite = (id: string) => {
    setRecipients((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
  };

  const handleRecipientPress = (recipient: Recipient) => {
    if (kycStatus !== 'verified') {
      setShowKyc(true);
      return;
    }
    setSelectedRecipient(recipient);
  };

  if (selectedRecipient) {
    return (
      <WithdrawScreen
        recipient={{
          name: selectedRecipient.name,
          bank: selectedRecipient.bank,
          account: selectedRecipient.account,
        }}
        onBack={() => setSelectedRecipient(null)}
        onComplete={() => setSelectedRecipient(null)}
      />
    );
  }

  if (showKyc) {
    return (
      <KycScreen
        onBack={() => setShowKyc(false)}
        onComplete={() => setShowKyc(false)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>어디로 보내시겠어요?</Text>

        {/* KYC Banner */}
        {kycStatus !== 'verified' && (
          <TouchableOpacity
            style={[styles.kycBanner, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}
            onPress={() => setShowKyc(true)}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.warning} />
            <View style={styles.kycBannerContent}>
              <Text style={[styles.kycBannerTitle, { color: colors.warning }]}>KYC 인증이 필요합니다</Text>
              <Text style={[styles.kycBannerDesc, { color: colors.textMuted }]}>출금을 위해 본인 인증을 진행해 주세요</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Address Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={address}
            onChangeText={setAddress}
            placeholder="계좌번호 입력"
            placeholderTextColor={colors.textMuted}
          />
          {address.length > 0 && (
            <TouchableOpacity onPress={() => setAddress('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === 'favorites' && { backgroundColor: colors.primaryBg, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'favorites' ? colors.primary : colors.textMuted }]}>
              주소 즐겨찾기
            </Text>
            <Ionicons
              name="star"
              size={14}
              color={activeTab === 'favorites' ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === 'recent' && { backgroundColor: colors.primaryBg, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab('recent')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'recent' ? colors.primary : colors.textMuted }]}>
              최근전송 현황
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info text */}
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          {activeTab === 'favorites'
            ? '내 주소를 즐겨찾기에 등록해보세요.'
            : '최근에 보낸 내역입니다.'}
        </Text>

        {/* Recipient List */}
        <View style={styles.listContainer}>
          {displayList.map((recipient) => (
            <TouchableOpacity
              key={recipient.id}
              style={[styles.recipientRow, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => handleRecipientPress(recipient)}
            >
              <View style={[styles.recipientIcon, { backgroundColor: recipient.iconColor + '20' }]}>
                <Ionicons name="person" size={18} color={recipient.iconColor} />
              </View>
              <View style={styles.recipientInfo}>
                <Text style={[styles.recipientName, { color: colors.textPrimary }]}>{recipient.name}</Text>
                <Text style={[styles.recipientAccount, { color: colors.textMuted }]}>
                  {recipient.bank} {recipient.account}
                </Text>
              </View>
              {activeTab === 'favorites' && (
                <TouchableOpacity
                  onPress={() => handleToggleFavorite(recipient.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={recipient.isFavorite ? 'star' : 'star-outline'}
                    size={18}
                    color={recipient.isFavorite ? colors.warning : colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}

          {displayList.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {activeTab === 'favorites'
                  ? '즐겨찾기에 등록된 주소가 없습니다.'
                  : '최근 전송 내역이 없습니다.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    marginBottom: Spacing.xl,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  infoText: {
    fontSize: 12,
    marginBottom: Spacing.lg,
  },
  listContainer: {
    gap: Spacing.sm,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  recipientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInfo: {
    flex: 1,
    gap: 2,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  recipientAccount: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  kycBannerContent: {
    flex: 1,
    gap: 2,
  },
  kycBannerTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  kycBannerDesc: {
    fontSize: 12,
  },
});
