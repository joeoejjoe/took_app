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
  Clipboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, PrimaryButton } from '../../components/common';

interface DepositScreenProps {
  onBack: () => void;
}

// 지원하는 자산 목록
interface Asset {
  id: string;
  symbol: string;
  name: string;
  network: string;
  minDeposit: string;
  iconColor: string;
  logoUrl: string;
}

// 코인 로고 URL (CoinGecko CDN)
const COIN_LOGOS = {
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
};

const SUPPORTED_ASSETS: Asset[] = [
  { id: 'eth', symbol: 'ETH', name: '이더리움', network: 'Ethereum', minDeposit: '0.001 ETH', iconColor: '#627EEA', logoUrl: COIN_LOGOS.ETH },
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', network: 'Ethereum (ERC-20)', minDeposit: '1 USDC', iconColor: '#2775CA', logoUrl: COIN_LOGOS.USDC },
  { id: 'usdt', symbol: 'USDT', name: 'Tether', network: 'Ethereum (ERC-20)', minDeposit: '1 USDT', iconColor: '#26A17B', logoUrl: COIN_LOGOS.USDT },
  { id: 'dai', symbol: 'DAI', name: 'Dai', network: 'Ethereum (ERC-20)', minDeposit: '1 DAI', iconColor: '#F5AC37', logoUrl: COIN_LOGOS.DAI },
];

type Step = 'select' | 'deposit';

export default function DepositScreen({ onBack }: DepositScreenProps) {
  const colors = useColors();
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const [step, setStep] = useState<Step>('select');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningConfirmed, setWarningConfirmed] = useState(false);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    if (!warningConfirmed) {
      setShowWarningModal(true);
    } else {
      setStep('deposit');
    }
  };

  const handleWarningConfirm = () => {
    setWarningConfirmed(true);
    setShowWarningModal(false);
    setStep('deposit');
  };

  const handleCopyAddress = async () => {
    if (!walletAddress) return;

    try {
      Clipboard.setString(walletAddress);
      Alert.alert('복사 완료', '입금 주소가 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('주소 복사', walletAddress);
    }
  };

  const handleShare = async () => {
    if (!walletAddress || !selectedAsset) return;

    try {
      await Share.share({
        message: `TOOK ${selectedAsset.symbol} 입금 주소\n\n네트워크: ${selectedAsset.network}\n주소: ${walletAddress}\n\n⚠️ 반드시 ${selectedAsset.network} 네트워크로만 전송해주세요.`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleBack = () => {
    if (step === 'deposit') {
      setStep('select');
      setSelectedAsset(null);
    } else {
      onBack();
    }
  };

  // 지갑 미연결 상태
  if (!walletAddress) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>입금하기</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="wallet-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>지갑 연결 필요</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            입금하려면 먼저 지갑을 연결해주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 자산 선택 화면
  if (step === 'select') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>입금하기</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            어떤 자산을 입금하시겠어요?
          </Text>

          {/* 자산 목록 */}
          <View style={styles.assetList}>
            {SUPPORTED_ASSETS.map((asset) => (
              <TouchableOpacity
                key={asset.id}
                style={[styles.assetItem, { backgroundColor: colors.surface }]}
                onPress={() => handleAssetSelect(asset)}
                activeOpacity={0.7}
              >
                <View style={[styles.assetIcon, { backgroundColor: asset.iconColor + '20' }]}>
                  <Image
                    source={{ uri: asset.logoUrl }}
                    style={styles.assetLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.assetInfo}>
                  <Text style={[styles.assetName, { color: colors.textPrimary }]}>{asset.name}</Text>
                  <Text style={[styles.assetNetwork, { color: colors.textMuted }]}>{asset.network}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* 안내 문구 */}
          <View style={[styles.infoBox, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              모든 자산은 Ethereum Mainnet을 통해 입금됩니다.{'\n'}
              다른 네트워크로 전송 시 자산을 잃을 수 있습니다.
            </Text>
          </View>
        </ScrollView>

        {/* 주의사항 모달 */}
        <Modal
          visible={showWarningModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWarningModal(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHandle} />

              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedAsset?.symbol} 입금 주의 사항 안내
              </Text>

              {/* 경고 배너 */}
              <View style={[styles.warningBanner, { backgroundColor: colors.error + '15' }]}>
                <View style={[styles.warningIconCircle, { backgroundColor: colors.error + '20' }]}>
                  <Ionicons name="alert" size={20} color={colors.error} />
                </View>
                <Text style={[styles.warningBannerText, { color: colors.error }]}>
                  미신고 가상자산사업자를 통한 입금은{'\n'}
                  이용약관에 따라 제한될 수 있습니다.
                </Text>
              </View>

              {/* 주의사항 목록 */}
              <ScrollView style={styles.warningList}>
                <WarningItem
                  text={`해당 디지털 자산은 ${selectedAsset?.network} 네트워크를 통한 입금만 지원합니다.`}
                  colors={colors}
                />
                <WarningItem
                  text={`${selectedAsset?.network} 네트워크가 아닌 다른 네트워크로 전송 시, 입금 반영이 불가능하오니 주의해 주시기 바랍니다.`}
                  colors={colors}
                />
                <WarningItem
                  text="컨트랙트 입금의 경우 입금에 지연이 발생할 수 있습니다."
                  colors={colors}
                />
                <WarningItem
                  text={`최소 입금 금액은 ${selectedAsset?.minDeposit}입니다. 미만 입금 시 잔고 반영이 불가능합니다.`}
                  colors={colors}
                />
                <WarningItem
                  text="입금 주소는 변경되지 않으며, 동일한 주소로 계속 입금하실 수 있습니다."
                  colors={colors}
                />
              </ScrollView>

              {/* 버튼 */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setShowWarningModal(false);
                    setSelectedAsset(null);
                  }}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, { backgroundColor: colors.primary }]}
                  onPress={handleWarningConfirm}
                >
                  <Text style={[styles.modalConfirmText, { color: colors.buttonPrimaryText }]}>확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // 입금 주소 화면
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {selectedAsset?.symbol} 입금하기
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* QR 코드 */}
        <View style={styles.qrContainer}>
          <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
            <QRCode
              value={walletAddress}
              size={180}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>
        </View>

        {/* 입금 안내 */}
        <Text style={[styles.depositGuide, { color: colors.textSecondary }]}>
          위 QR코드를 스캔하거나 아래 주소로{'\n'}
          {selectedAsset?.symbol}을 입금해주세요.
        </Text>

        {/* 네트워크 정보 */}
        <View style={styles.networkSection}>
          <Text style={[styles.networkLabel, { color: colors.textMuted }]}>입금 네트워크</Text>
          <View style={[styles.networkBox, { backgroundColor: colors.surface }]}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <Text style={[styles.networkText, { color: colors.textPrimary }]}>
              {selectedAsset?.network}
            </Text>
          </View>
        </View>

        {/* 입금 주소 */}
        <View style={styles.addressSection}>
          <Text style={[styles.addressLabel, { color: colors.textMuted }]}>입금 주소</Text>
          <View style={[styles.addressBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.addressText, { color: colors.primary }]}>
              {walletAddress}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: colors.primary }]}
              onPress={handleCopyAddress}
            >
              <Text style={[styles.copyButtonText, { color: colors.buttonPrimaryText }]}>복사</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 최소 입금 금액 경고 */}
        <View style={[styles.minDepositWarning, { borderColor: colors.warning }]}>
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={[styles.minDepositText, { color: colors.warning }]}>
            최소 입금 금액은 {selectedAsset?.minDeposit}입니다.{'\n'}
            미만 입금 시 잔고 반영이 불가능합니다.
          </Text>
        </View>

        {/* 입금 전 주의사항 */}
        <View style={[styles.noticeSection, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>
            입금 전 꼭 알아두세요!
          </Text>
          <View style={styles.noticeList}>
            <NoticeItem
              text={`위 주소로는 ${selectedAsset?.symbol}만 입금이 가능합니다. 해당 주소로 다른 디지털 자산을 입금 시도할 경우에 발생할 수 있는 오류/손실은 복구가 불가합니다.`}
              colors={colors}
            />
            <NoticeItem
              text={`반드시 ${selectedAsset?.network} 네트워크를 통해서만 입금해주세요.`}
              colors={colors}
            />
            <NoticeItem
              text="입금 완료 후 블록체인 네트워크 확인이 완료되면 잔고에 반영됩니다. (약 12 확인 필요)"
              colors={colors}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function WarningItem({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={warningStyles.container}>
      <Text style={[warningStyles.bullet, { color: colors.textMuted }]}>•</Text>
      <Text style={[warningStyles.text, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const warningStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
});

function NoticeItem({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={noticeStyles.container}>
      <Text style={[noticeStyles.bullet, { color: colors.textMuted }]}>•</Text>
      <Text style={[noticeStyles.text, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const noticeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 20,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
  },
  headerRight: {
    width: 32,
  },
  shareButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  // Asset List
  assetList: {
    gap: Spacing.sm,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetLogo: {
    width: 28,
    height: 28,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  assetNetwork: {
    fontSize: 13,
    marginTop: 2,
  },
  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  // QR Code
  qrContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  qrWrapper: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  depositGuide: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  // Network
  networkSection: {
    marginBottom: Spacing.lg,
  },
  networkLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  networkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  networkText: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
  },
  // Address
  addressSection: {
    marginBottom: Spacing.lg,
  },
  addressLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  copyButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
  },
  // Min Deposit Warning
  minDepositWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  minDepositText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  // Notice Section
  noticeSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  noticeList: {
    gap: 0,
  },
  // Empty State
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing['2xl'],
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#6B7280',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  warningIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
  },
  warningList: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    maxHeight: 300,
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
});
