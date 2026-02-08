import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Card, PrimaryButton } from '../../components/common';
import { formatUSD } from '../../utils/format';
import { useBlockchainStore } from '../../store/useBlockchainStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePrivyTransaction } from '../../hooks/usePrivyTransaction';
import { getExplorerTxUrl, TOKEN_ADDRESSES } from '../../services';

// 코인 로고 URL (CoinGecko CDN)
const COIN_LOGOS: Record<string, string> = {
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
  GHO: 'https://assets.coingecko.com/coins/images/30663/small/gho-token-logo.png',
};

// 출금 가능한 자산
interface Asset {
  id: string;
  symbol: 'ETH' | 'USDC' | 'USDT' | 'DAI' | 'GHO';
  name: string;
  balance: number;
  balanceRaw: string;
  decimals: number;
  iconColor: string;
  logoUrl?: string;
  address?: string;
}

// 네트워크 (MVP는 Ethereum Mainnet만 지원)
interface Network {
  id: string;
  name: string;
  shortName: string;
  estimatedTime: string;
}

const ETHEREUM_NETWORK: Network = {
  id: 'eth',
  name: 'Ethereum Mainnet',
  shortName: 'ETH',
  estimatedTime: '~3분',
};

type Step = 'asset' | 'input' | 'confirm' | 'sending' | 'complete';

export default function TransferScreen() {
  const colors = useColors();
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const { balances, isLoading: isLoadingBalances, fetchBalances } = useBlockchainStore();
  const {
    status: txStatus,
    txHash,
    error: txError,
    sendEth,
    sendToken,
    estimateGas,
    reset: resetTx,
    isWalletReady,
  } = usePrivyTransaction();

  const [step, setStep] = useState<Step>('asset');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);

  // 잔액 새로고침
  useEffect(() => {
    if (walletAddress) {
      fetchBalances(walletAddress);
    }
  }, [walletAddress, fetchBalances]);

  // 실제 잔액에서 자산 목록 생성
  const assets: Asset[] = useMemo(() => {
    if (!balances) return [];

    const result: Asset[] = [];

    // ETH
    const ethBalance = parseFloat(balances.eth);
    if (ethBalance > 0) {
      result.push({
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: ethBalance,
        balanceRaw: balances.eth,
        decimals: 18,
        iconColor: '#627EEA',
        logoUrl: COIN_LOGOS.ETH,
      });
    }

    // 토큰들
    for (const token of balances.tokens) {
      const tokenBalance = parseFloat(token.balanceFormatted);
      if (tokenBalance > 0) {
        result.push({
          id: token.symbol.toLowerCase(),
          symbol: token.symbol as Asset['symbol'],
          name: token.symbol === 'USDC' ? 'USD Coin' :
                token.symbol === 'USDT' ? 'Tether' :
                token.symbol === 'DAI' ? 'Dai' :
                token.symbol === 'GHO' ? 'GHO' : token.symbol,
          balance: tokenBalance,
          balanceRaw: token.balanceFormatted,
          decimals: token.decimals,
          iconColor: token.symbol === 'USDC' ? '#2775CA' :
                     token.symbol === 'USDT' ? '#26A17B' :
                     token.symbol === 'DAI' ? '#F5AC37' :
                     token.symbol === 'GHO' ? '#6E55FF' : '#888888',
          logoUrl: COIN_LOGOS[token.symbol],
          address: token.address,
        });
      }
    }

    return result;
  }, [balances]);

  const availableBalance = selectedAsset?.balance || 0;
  const amountNum = parseFloat(amount || '0');
  const isValidAddress = address.startsWith('0x') && address.length === 42;
  const isValidAmount = amountNum > 0 && amountNum <= availableBalance;

  // 가스비 추정
  useEffect(() => {
    const estimateGasFee = async () => {
      if (!isValidAddress || !amountNum || !selectedAsset) {
        setGasEstimate(null);
        return;
      }

      try {
        const tokenSymbol = selectedAsset.symbol === 'ETH' ? undefined : selectedAsset.symbol;
        const estimate = await estimateGas(address, amount, tokenSymbol as any);
        if (estimate) {
          setGasEstimate(estimate.estimatedCostEth);
        }
      } catch (err) {
        console.error('Gas estimation failed:', err);
        setGasEstimate(null);
      }
    };

    const debounce = setTimeout(estimateGasFee, 500);
    return () => clearTimeout(debounce);
  }, [address, amount, selectedAsset, isValidAddress, amountNum, estimateGas]);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setStep('input');
  };

  const handleQuickAmount = (percentage: number) => {
    const value = availableBalance * percentage;
    // ETH의 경우 가스비를 위해 조금 남겨둠
    if (selectedAsset?.symbol === 'ETH' && percentage === 1) {
      const reserved = Math.min(0.005, value * 0.1); // 최소 0.005 ETH 또는 10% 남김
      setAmount(Math.max(0, value - reserved).toFixed(6));
    } else {
      setAmount(selectedAsset?.decimals === 18 ? value.toFixed(6) : value.toFixed(2));
    }
  };

  const handleContinue = () => {
    if (!isValidAddress) {
      Alert.alert('알림', '올바른 이더리움 주소를 입력해주세요.');
      return;
    }
    if (!isValidAmount) {
      Alert.alert('알림', '유효한 금액을 입력해주세요.');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedAsset || !isWalletReady) {
      Alert.alert('오류', '지갑이 연결되지 않았습니다.');
      return;
    }

    setStep('sending');
    resetTx();

    try {
      if (selectedAsset.symbol === 'ETH') {
        await sendEth(address, amount);
      } else {
        await sendToken(selectedAsset.symbol as any, address, amount);
      }
      setStep('complete');

      // 잔액 새로고침
      if (walletAddress) {
        setTimeout(() => fetchBalances(walletAddress), 3000);
      }
    } catch (err) {
      console.error('Transaction failed:', err);
      Alert.alert(
        '전송 실패',
        txError || '트랜잭션 전송에 실패했습니다. 다시 시도해주세요.',
        [{ text: '확인', onPress: () => setStep('confirm') }]
      );
    }
  };

  const handleBack = () => {
    if (step === 'input') {
      setStep('asset');
      setSelectedAsset(null);
      setAddress('');
      setAmount('');
      setGasEstimate(null);
    } else if (step === 'confirm') {
      setStep('input');
    } else if (step === 'complete') {
      setStep('asset');
      setSelectedAsset(null);
      setAddress('');
      setAmount('');
      setGasEstimate(null);
      resetTx();
    }
  };

  const handleViewOnExplorer = () => {
    if (txHash) {
      Linking.openURL(getExplorerTxUrl(txHash));
    }
  };

  // 지갑 미연결 상태
  if (!walletAddress) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContent}>
          <Ionicons name="wallet-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>지갑 연결 필요</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            출금하려면 먼저 지갑을 연결해주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 로딩 상태
  if (isLoadingBalances && !balances) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            잔액을 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 자산 선택 화면
  if (step === 'asset') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>출금</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            어떤 자산을 출금하시겠어요?
          </Text>

          {/* 자산 목록 */}
          {assets.length > 0 ? (
            <View style={styles.assetList}>
              {assets.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  style={[styles.assetItem, { backgroundColor: colors.surface }]}
                  onPress={() => handleAssetSelect(asset)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.assetIcon, { backgroundColor: asset.iconColor + '20' }]}>
                    {asset.logoUrl ? (
                      <Image
                        source={{ uri: asset.logoUrl }}
                        style={styles.assetLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={[styles.assetIconText, { color: asset.iconColor }]}>
                        {asset.symbol.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={[styles.assetName, { color: colors.textPrimary }]}>{asset.name}</Text>
                    <Text style={[styles.assetSymbol, { color: colors.textMuted }]}>{asset.symbol}</Text>
                  </View>
                  <View style={styles.assetBalanceContainer}>
                    <Text style={[styles.assetBalance, { color: colors.textPrimary }]}>
                      {asset.decimals === 18 ? asset.balance.toFixed(6) : formatUSD(asset.balance)} {asset.symbol}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAssets}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyAssetsText, { color: colors.textSecondary }]}>
                출금 가능한 자산이 없습니다.
              </Text>
            </View>
          )}

          {/* 주의사항 */}
          <View style={[styles.warningBox, { backgroundColor: colors.warning + '10' }]}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              출금 전 반드시 주소가 정확한지 확인하세요.{'\n'}
              잘못된 주소로 전송 시 자산을 복구할 수 없습니다.
            </Text>
          </View>

          {/* 네트워크 정보 */}
          <View style={[styles.networkInfo, { backgroundColor: colors.surface }]}>
            <Ionicons name="globe-outline" size={16} color={colors.primary} />
            <Text style={[styles.networkInfoText, { color: colors.textSecondary }]}>
              Ethereum Mainnet에서 전송됩니다.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 출금 정보 입력 화면
  if (step === 'input') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <View style={[styles.headerIcon, { backgroundColor: selectedAsset?.iconColor + '20' }]}>
                {selectedAsset?.logoUrl ? (
                  <Image
                    source={{ uri: selectedAsset.logoUrl }}
                    style={styles.headerLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={[styles.headerIconText, { color: selectedAsset?.iconColor }]}>
                    {selectedAsset?.symbol.charAt(0)}
                  </Text>
                )}
              </View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {selectedAsset?.symbol} 출금
              </Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* 주소 입력 */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              받는 주소
            </Text>
            <View style={[styles.addressInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addressInput, { color: colors.textPrimary }]}
                value={address}
                onChangeText={setAddress}
                placeholder="0x..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {address && (
                <TouchableOpacity onPress={() => setAddress('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {address && !isValidAddress && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                올바른 이더리움 주소를 입력해주세요.
              </Text>
            )}

            {/* 금액 입력 */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
              출금 수량
            </Text>
            <View style={[styles.amountInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.amountInput, { color: colors.textPrimary }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.amountSymbol, { color: colors.textSecondary }]}>
                {selectedAsset?.symbol}
              </Text>
              <TouchableOpacity onPress={() => handleQuickAmount(1)} style={[styles.maxButton, { backgroundColor: colors.primaryBg }]}>
                <Text style={[styles.maxButtonText, { color: colors.primary }]}>MAX</Text>
              </TouchableOpacity>
            </View>

            {/* 잔액 정보 */}
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>출금 가능</Text>
              <Text style={[styles.balanceValue, { color: colors.textSecondary }]}>
                {selectedAsset?.decimals === 18 ? availableBalance.toFixed(6) : formatUSD(availableBalance)} {selectedAsset?.symbol}
              </Text>
            </View>

            {/* 빠른 금액 버튼 */}
            <View style={styles.quickAmountRow}>
              {[0.25, 0.5, 0.75, 1].map((percent) => (
                <TouchableOpacity
                  key={percent}
                  style={[styles.quickAmountButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleQuickAmount(percent)}
                >
                  <Text style={[styles.quickAmountText, { color: colors.textSecondary }]}>
                    {percent * 100}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 가스비 정보 */}
            <Card variant="dark" style={styles.feeCard}>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: colors.textMuted }]}>네트워크</Text>
                <Text style={[styles.feeValue, { color: colors.textSecondary }]}>
                  {ETHEREUM_NETWORK.name}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: colors.textMuted }]}>예상 가스비</Text>
                <Text style={[styles.feeValue, { color: colors.textSecondary }]}>
                  {gasEstimate ? `~${gasEstimate} ETH` : '계산 중...'}
                </Text>
              </View>
              <View style={[styles.feeRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.sm, marginTop: Spacing.sm }]}>
                <Text style={[styles.feeLabel, { color: colors.textPrimary }]}>예상 도착</Text>
                <Text style={[styles.receiveValue, { color: colors.primary }]}>
                  {ETHEREUM_NETWORK.estimatedTime}
                </Text>
              </View>
            </Card>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.bottomContainer}>
            <PrimaryButton
              title="계속"
              onPress={handleContinue}
              disabled={!isValidAddress || !isValidAmount}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 확인 화면
  if (step === 'confirm') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>출금 확인</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.confirmContent}>
          {/* 보내는 금액 */}
          <View style={styles.confirmAmountSection}>
            <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>전송 금액</Text>
            <Text style={[styles.confirmAmount, { color: colors.textPrimary }]}>
              {amount} {selectedAsset?.symbol}
            </Text>
          </View>

          {/* 상세 정보 */}
          <Card variant="dark" style={styles.confirmCard}>
            <ConfirmRow label="네트워크" value={ETHEREUM_NETWORK.name} />
            <ConfirmRow
              label="받는 주소"
              value={`${address.slice(0, 10)}...${address.slice(-8)}`}
            />
            <ConfirmRow label="전송 수량" value={`${amount} ${selectedAsset?.symbol}`} />
            <ConfirmRow
              label="예상 가스비"
              value={gasEstimate ? `~${gasEstimate} ETH` : '계산 중...'}
            />
          </Card>

          {/* 경고 메시지 */}
          <View style={[styles.confirmWarning, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="alert-circle" size={18} color={colors.warning} />
            <Text style={[styles.confirmWarningText, { color: colors.textSecondary }]}>
              주소가 정확한지 확인하세요.{'\n'}
              트랜잭션은 취소할 수 없으며, 잘못된 주소로 전송 시{'\n'}
              자산을 복구할 수 없습니다.
            </Text>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.bottomContainer}>
          <PrimaryButton title="출금 확인" onPress={handleConfirm} />
        </View>
      </SafeAreaView>
    );
  }

  // 전송 중 화면
  if (step === 'sending') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.sendingTitle, { color: colors.textPrimary }]}>
            {txStatus === 'preparing' && '트랜잭션 준비 중...'}
            {txStatus === 'signing' && '서명 중...'}
            {txStatus === 'pending' && '전송 중...'}
            {txStatus === 'confirming' && '블록 확인 중...'}
          </Text>
          <Text style={[styles.sendingSubtitle, { color: colors.textSecondary }]}>
            Privy 지갑으로 서명하고 있습니다.{'\n'}잠시만 기다려주세요.
          </Text>
          {txHash && (
            <TouchableOpacity onPress={handleViewOnExplorer} style={styles.viewTxButton}>
              <Text style={[styles.viewTxText, { color: colors.primary }]}>
                Etherscan에서 보기
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // 완료 화면
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.completeContent}>
        <View style={[styles.completeIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={48} color={colors.buttonPrimaryText} />
        </View>
        <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>전송 완료</Text>
        <Text style={[styles.completeDescription, { color: colors.textSecondary }]}>
          트랜잭션이 성공적으로 전송되었습니다.
        </Text>

        <Card variant="dark" style={styles.completeCard}>
          <ConfirmRow label="전송 자산" value={`${amount} ${selectedAsset?.symbol}`} />
          <ConfirmRow label="네트워크" value={ETHEREUM_NETWORK.name} />
          <ConfirmRow
            label="받는 주소"
            value={`${address.slice(0, 10)}...${address.slice(-8)}`}
          />
        </Card>

        {txHash && (
          <TouchableOpacity onPress={handleViewOnExplorer} style={styles.explorerButton}>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
            <Text style={[styles.explorerButtonText, { color: colors.primary }]}>
              Etherscan에서 확인
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="완료" onPress={handleBack} />
      </View>
    </SafeAreaView>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={confirmRowStyles.container}>
      <Text style={[confirmRowStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[confirmRowStyles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const confirmRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.md,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: Spacing.xl,
  },
  // 헤더
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 18,
    height: 18,
  },
  headerIconText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
  },
  headerRight: {
    width: 32,
  },
  // 자산 목록
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
  assetIconText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  assetSymbol: {
    fontSize: 13,
    marginTop: 2,
  },
  assetBalanceContainer: {
    alignItems: 'flex-end',
  },
  assetBalance: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  // 빈 자산
  emptyAssets: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyAssetsText: {
    fontSize: 15,
    marginTop: Spacing.md,
  },
  // 경고 박스
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  // 네트워크 정보
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  networkInfoText: {
    fontSize: 13,
  },
  // 입력 폼
  label: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.md,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    paddingVertical: Spacing.md,
  },
  amountSymbol: {
    fontSize: 15,
    marginRight: Spacing.sm,
  },
  maxButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  balanceLabel: {
    fontSize: 13,
  },
  balanceValue: {
    fontSize: 13,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  feeCard: {
    marginTop: Spacing.xl,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
  },
  receiveValue: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  // 하단 버튼
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  // 확인 화면
  confirmContent: {
    paddingTop: Spacing.xl,
  },
  confirmAmountSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  confirmLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  confirmAmount: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
  },
  confirmCard: {
    marginBottom: Spacing.lg,
  },
  confirmWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  confirmWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  // 전송 중 화면
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sendingTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sendingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  viewTxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  viewTxText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  // 완료 화면
  completeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  completeDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  completeCard: {
    width: '100%',
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  explorerButtonText: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
  },
  // 빈 상태
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
  loadingText: {
    fontSize: 15,
    marginTop: Spacing.lg,
  },
});
