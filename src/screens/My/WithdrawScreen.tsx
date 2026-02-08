import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius, TOKEN_LOGO_URLS, TOKEN_COLORS } from '../../constants';
import { Card, PrimaryButton } from '../../components/common';
import { useColors } from '../../hooks/useColors';
import { useBlockchainStore } from '../../store/useBlockchainStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePrivyTransaction, TransactionStatus } from '../../hooks/usePrivyTransaction';
import { getExplorerTxUrl } from '../../services';
import { formatUSD } from '../../utils/format';

interface WithdrawScreenProps {
  onBack: () => void;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
  network: string;
  iconColor: string;
  logoUrl: string;
  balance: number;
  isToken: boolean;
}

const COIN_LOGOS: Record<string, string> = {
  ETH: TOKEN_LOGO_URLS.ETH,
  USDC: TOKEN_LOGO_URLS.USDC,
  USDT: TOKEN_LOGO_URLS.USDT,
  DAI: TOKEN_LOGO_URLS.DAI,
  GHO: TOKEN_LOGO_URLS.GHO,
};

export default function WithdrawScreen({ onBack }: WithdrawScreenProps) {
  const colors = useColors();
  const { walletAddress } = useAuthStore();
  const { balances, fetchBalances } = useBlockchainStore();
  const {
    status,
    txHash,
    error,
    sendEth,
    sendToken,
    estimateGas,
    reset,
    isWalletReady,
    isSmartWallet,
  } = usePrivyTransaction();

  // ETH 잔액 (가스비용) - Smart Wallet은 가스비 무료
  const ethBalance = balances?.ethFormatted ? parseFloat(balances.ethFormatted) : 0;
  const hasEnoughEthForGas = isSmartWallet || ethBalance >= 0.001; // Smart Wallet이면 항상 true

  // 화면 상태
  const [step, setStep] = useState<'select' | 'input' | 'confirm' | 'processing' | 'result'>('select');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  // 잔액에서 자산 목록 생성
  const assets: Asset[] = [];

  // ETH 추가
  if (balances?.ethFormatted) {
    const ethBalance = parseFloat(balances.ethFormatted);
    if (ethBalance > 0) {
      assets.push({
        id: 'eth',
        symbol: 'ETH',
        name: '이더리움',
        network: 'Ethereum',
        iconColor: TOKEN_COLORS.ETH,
        logoUrl: COIN_LOGOS.ETH,
        balance: ethBalance,
        isToken: false,
      });
    }
  }

  // 토큰 추가
  if (balances?.tokens) {
    balances.tokens.forEach((token) => {
      const balance = parseFloat(token.balanceFormatted);
      if (balance > 0) {
        assets.push({
          id: token.address,
          symbol: token.symbol,
          name: token.symbol === 'USDC' ? 'USD Coin' :
                token.symbol === 'USDT' ? 'Tether' :
                token.symbol === 'DAI' ? 'Dai Stablecoin' :
                token.symbol === 'GHO' ? 'GHO' : token.symbol,
          network: 'Ethereum (ERC-20)',
          iconColor: TOKEN_COLORS[token.symbol] || '#4ADE80',
          logoUrl: COIN_LOGOS[token.symbol] || '',
          balance,
          isToken: true,
        });
      }
    });
  }

  // 잔액 로드
  useEffect(() => {
    if (walletAddress) {
      fetchBalances(walletAddress);
    }
  }, [walletAddress, fetchBalances]);

  // 가스비 추정
  const estimateGasFee = useCallback(async () => {
    if (!selectedAsset || !recipientAddress || !amount || parseFloat(amount) <= 0) {
      setEstimatedGas(null);
      return;
    }

    // 주소 유효성 검사
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      setEstimatedGas(null);
      return;
    }

    setIsEstimatingGas(true);
    try {
      const gasEstimate = await estimateGas(
        recipientAddress,
        amount,
        selectedAsset.isToken ? selectedAsset.symbol as 'USDC' | 'USDT' | 'DAI' | 'GHO' : undefined
      );
      if (gasEstimate) {
        setEstimatedGas(gasEstimate.estimatedCostEth);
      }
    } catch (err) {
      console.error('Gas estimation failed:', err);
      setEstimatedGas(null);
    } finally {
      setIsEstimatingGas(false);
    }
  }, [selectedAsset, recipientAddress, amount, estimateGas]);

  // 금액이나 주소 변경 시 가스비 재추정
  useEffect(() => {
    const timer = setTimeout(() => {
      estimateGasFee();
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, recipientAddress, estimateGasFee]);

  // 자산 선택
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowWarningModal(true);
  };

  // 경고 확인 후 입력 화면으로
  const handleWarningConfirm = () => {
    setShowWarningModal(false);
    setStep('input');
  };

  // 주소 유효성 검사
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // 최대 금액 설정
  const handleMaxAmount = () => {
    if (selectedAsset) {
      // 가스비를 위해 약간 남겨둠 (ETH인 경우)
      if (selectedAsset.symbol === 'ETH') {
        const maxAmount = Math.max(0, selectedAsset.balance - 0.005);
        setAmount(maxAmount.toString());
      } else {
        setAmount(selectedAsset.balance.toString());
      }
    }
  };

  // 출금 가능 여부 확인
  const canProceed = (): boolean => {
    if (!selectedAsset || !recipientAddress || !amount) return false;
    if (!isValidAddress(recipientAddress)) return false;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return false;
    if (amountNum > selectedAsset.balance) return false;
    // ETH가 아닌 토큰 전송 시 가스비를 위한 ETH 필요
    if (selectedAsset.isToken && !hasEnoughEthForGas) return false;
    // ETH 전송 시 금액 + 가스비 확인
    if (!selectedAsset.isToken && amountNum + 0.001 > selectedAsset.balance) return false;
    return true;
  };

  // 확인 화면으로 이동
  const handleProceedToConfirm = () => {
    if (canProceed()) {
      setStep('confirm');
    }
  };

  // 출금 실행
  const handleWithdraw = async () => {
    if (!selectedAsset || !recipientAddress || !amount) return;

    setStep('processing');
    reset();

    try {
      if (selectedAsset.isToken) {
        await sendToken(
          selectedAsset.symbol as 'USDC' | 'USDT' | 'DAI' | 'GHO',
          recipientAddress,
          amount
        );
      } else {
        await sendEth(recipientAddress, amount);
      }
      setStep('result');
    } catch (err) {
      console.error('Withdraw failed:', err);
      setStep('result');
    }
  };

  // 처음으로 돌아가기
  const handleReset = () => {
    setStep('select');
    setSelectedAsset(null);
    setRecipientAddress('');
    setAmount('');
    setEstimatedGas(null);
    reset();
  };

  // 트랜잭션 상태 텍스트
  const getStatusText = (s: TransactionStatus): string => {
    switch (s) {
      case 'preparing': return '트랜잭션 준비 중...';
      case 'signing': return '서명 중...';
      case 'pending': return '전송 중...';
      case 'confirming': return '블록 확인 중...';
      case 'success': return '출금 완료!';
      case 'error': return '출금 실패';
      default: return '';
    }
  };

  // 자산 선택 화면
  const renderSelectStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
        출금할 자산 선택
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        외부 지갑으로 보낼 자산을 선택하세요
      </Text>

      {assets.length === 0 ? (
        <Card variant="dark" style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            출금 가능한 자산이 없습니다
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            먼저 자산을 입금하세요
          </Text>
        </Card>
      ) : (
        <View style={styles.assetList}>
          {assets.map((asset) => (
            <TouchableOpacity
              key={asset.id}
              style={[styles.assetItem, { backgroundColor: colors.surface }]}
              onPress={() => handleAssetSelect(asset)}
              activeOpacity={0.7}
            >
              <View style={[styles.assetIcon, { backgroundColor: asset.iconColor }]}>
                {asset.logoUrl ? (
                  <Image source={{ uri: asset.logoUrl }} style={styles.assetLogo} />
                ) : (
                  <Text style={styles.assetIconText}>{asset.symbol.charAt(0)}</Text>
                )}
              </View>
              <View style={styles.assetInfo}>
                <Text style={[styles.assetName, { color: colors.textPrimary }]}>
                  {asset.symbol}
                </Text>
                <Text style={[styles.assetNetwork, { color: colors.textMuted }]}>
                  {asset.network}
                </Text>
              </View>
              <View style={styles.assetBalance}>
                <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>
                  {asset.balance.toFixed(asset.isToken ? 2 : 4)} {asset.symbol}
                </Text>
                {asset.isToken && (
                  <Text style={[styles.balanceUsd, { color: colors.textMuted }]}>
                    ≈ ${formatUSD(asset.balance)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // 입력 화면
  const renderInputStep = () => (
    <KeyboardAvoidingView
      style={styles.content}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 선택된 자산 정보 */}
        <Card variant="dark" style={styles.selectedAssetCard}>
          <View style={styles.selectedAssetRow}>
            <View style={[styles.assetIcon, { backgroundColor: selectedAsset?.iconColor }]}>
              {selectedAsset?.logoUrl ? (
                <Image source={{ uri: selectedAsset.logoUrl }} style={styles.assetLogo} />
              ) : (
                <Text style={styles.assetIconText}>{selectedAsset?.symbol.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.selectedAssetInfo}>
              <Text style={[styles.selectedAssetName, { color: colors.textPrimary }]}>
                {selectedAsset?.symbol}
              </Text>
              <Text style={[styles.selectedAssetBalance, { color: colors.textMuted }]}>
                잔액: {selectedAsset?.balance.toFixed(selectedAsset?.isToken ? 2 : 4)} {selectedAsset?.symbol}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setStep('select')}>
              <Text style={[styles.changeButton, { color: colors.primary }]}>변경</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 받는 주소 입력 */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            받는 주소
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="0x..."
              placeholderTextColor={colors.textMuted}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {recipientAddress && !isValidAddress(recipientAddress) && (
            <Text style={[styles.errorText, { color: colors.textRed }]}>
              유효하지 않은 주소입니다
            </Text>
          )}
        </View>

        {/* 금액 입력 */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabelRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              출금 금액
            </Text>
            <TouchableOpacity onPress={handleMaxAmount}>
              <Text style={[styles.maxButton, { color: colors.primary }]}>최대</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>
              {selectedAsset?.symbol}
            </Text>
          </View>
          {amount && parseFloat(amount) > (selectedAsset?.balance || 0) && (
            <Text style={[styles.errorText, { color: colors.textRed }]}>
              잔액이 부족합니다
            </Text>
          )}
        </View>

        {/* 가스비 정보 */}
        <Card variant="dark" style={styles.gasCard}>
          <View style={styles.gasRow}>
            <Text style={[styles.gasLabel, { color: colors.textSecondary }]}>
              네트워크 수수료
            </Text>
            {isSmartWallet ? (
              <View style={[styles.sponsoredBadge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={[styles.sponsoredText, { color: colors.primary }]}>
                  무료 (Sponsored)
                </Text>
              </View>
            ) : isEstimatingGas ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : estimatedGas ? (
              <Text style={[styles.gasValue, { color: colors.textPrimary }]}>
                ~{estimatedGas} ETH
              </Text>
            ) : (
              <Text style={[styles.gasValue, { color: colors.textMuted }]}>
                --
              </Text>
            )}
          </View>
          {isSmartWallet ? (
            <Text style={[styles.gasNote, { color: colors.textMuted }]}>
              Smart Wallet 사용 중 - 가스비가 자동으로 대납됩니다
            </Text>
          ) : (
            <View style={styles.gasBalanceRow}>
              <Text style={[styles.gasNote, { color: colors.textMuted }]}>
                내 ETH 잔액:
              </Text>
              <Text style={[styles.gasNote, { color: hasEnoughEthForGas ? colors.textSecondary : colors.textRed }]}>
                {ethBalance.toFixed(6)} ETH
              </Text>
            </View>
          )}
        </Card>

        {/* ETH 부족 경고 - Smart Wallet이 아닐 때만 표시 */}
        {!isSmartWallet && !hasEnoughEthForGas && (
          <View style={[styles.ethWarningBox, { backgroundColor: colors.textRed + '15' }]}>
            <Ionicons name="alert-circle" size={20} color={colors.textRed} />
            <View style={styles.ethWarningContent}>
              <Text style={[styles.ethWarningTitle, { color: colors.textRed }]}>
                가스비를 위한 ETH가 부족합니다
              </Text>
              <Text style={[styles.ethWarningText, { color: colors.textSecondary }]}>
                출금을 위해서는 최소 0.001 ETH 이상의 가스비가 필요합니다.{'\n'}
                먼저 ETH를 입금해주세요.
              </Text>
            </View>
          </View>
        )}

        {/* 경고 */}
        <View style={[styles.warningBox, { backgroundColor: colors.warning + '15' }]}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            출금 후에는 취소할 수 없습니다.{'\n'}
            주소를 다시 한번 확인해주세요.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.bottomButton, { backgroundColor: colors.background }]}>
        <PrimaryButton
          title="출금하기"
          onPress={handleProceedToConfirm}
          disabled={!canProceed()}
        />
      </View>
    </KeyboardAvoidingView>
  );

  // 확인 화면
  const renderConfirmStep = () => (
    <View style={styles.content}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
        출금 확인
      </Text>

      <Card variant="dark" style={styles.confirmCard}>
        {/* 금액 */}
        <View style={styles.confirmAmountSection}>
          <View style={[styles.assetIcon, { backgroundColor: selectedAsset?.iconColor, marginBottom: Spacing.md }]}>
            {selectedAsset?.logoUrl ? (
              <Image source={{ uri: selectedAsset.logoUrl }} style={styles.assetLogo} />
            ) : (
              <Text style={styles.assetIconText}>{selectedAsset?.symbol.charAt(0)}</Text>
            )}
          </View>
          <Text style={[styles.confirmAmount, { color: colors.textPrimary }]}>
            {amount} {selectedAsset?.symbol}
          </Text>
          {selectedAsset?.isToken && (
            <Text style={[styles.confirmAmountUsd, { color: colors.textMuted }]}>
              ≈ ${formatUSD(parseFloat(amount))}
            </Text>
          )}
        </View>

        <View style={[styles.confirmDivider, { backgroundColor: colors.border }]} />

        {/* 상세 정보 */}
        <View style={styles.confirmDetails}>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>받는 주소</Text>
            <Text style={[styles.confirmValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {recipientAddress.slice(0, 10)}...{recipientAddress.slice(-8)}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>네트워크</Text>
            <Text style={[styles.confirmValue, { color: colors.textPrimary }]}>
              Ethereum
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>네트워크 수수료</Text>
            {isSmartWallet ? (
              <Text style={[styles.confirmValue, { color: colors.primary }]}>
                무료 (Sponsored)
              </Text>
            ) : (
              <Text style={[styles.confirmValue, { color: colors.textSecondary }]}>
                ~{estimatedGas || '0.0001'} ETH
              </Text>
            )}
          </View>
        </View>
      </Card>

      {/* 최종 경고 */}
      <View style={[styles.finalWarning, { backgroundColor: colors.textRed + '15' }]}>
        <Ionicons name="alert-circle" size={20} color={colors.textRed} />
        <Text style={[styles.finalWarningText, { color: colors.textSecondary }]}>
          출금을 진행하면 취소할 수 없습니다.{'\n'}
          모든 정보가 정확한지 확인하세요.
        </Text>
      </View>

      <View style={styles.confirmButtons}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => setStep('input')}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
            취소
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 2 }}>
          <PrimaryButton
            title="확인 및 출금"
            onPress={handleWithdraw}
          />
        </View>
      </View>
    </View>
  );

  // 처리 중 화면
  const renderProcessingStep = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.processingText, { color: colors.textPrimary }]}>
        {getStatusText(status)}
      </Text>
      <Text style={[styles.processingSubtext, { color: colors.textMuted }]}>
        잠시만 기다려주세요...
      </Text>
    </View>
  );

  // 결과 화면
  const renderResultStep = () => {
    const isSuccess = status === 'success';

    return (
      <View style={styles.centerContent}>
        <View style={[
          styles.resultIcon,
          { backgroundColor: isSuccess ? colors.primary + '20' : colors.textRed + '20' }
        ]}>
          <Ionicons
            name={isSuccess ? 'checkmark-circle' : 'close-circle'}
            size={64}
            color={isSuccess ? colors.primary : colors.textRed}
          />
        </View>

        <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
          {isSuccess ? '출금 완료!' : '출금 실패'}
        </Text>

        {isSuccess ? (
          <>
            <Text style={[styles.resultAmount, { color: colors.textPrimary }]}>
              {amount} {selectedAsset?.symbol}
            </Text>
            <Text style={[styles.resultSubtext, { color: colors.textMuted }]}>
              {recipientAddress.slice(0, 10)}...{recipientAddress.slice(-8)}
            </Text>
          </>
        ) : (
          <Text style={[styles.resultError, { color: colors.textSecondary }]}>
            {error || '알 수 없는 오류가 발생했습니다'}
          </Text>
        )}

        {txHash && (
          <TouchableOpacity
            style={[styles.viewTxButton, { borderColor: colors.primary }]}
            onPress={() => Linking.openURL(getExplorerTxUrl(txHash))}
          >
            <Ionicons name="open-outline" size={16} color={colors.primary} />
            <Text style={[styles.viewTxText, { color: colors.primary }]}>
              트랜잭션 보기
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.resultButtons}>
          <TouchableOpacity
            style={[styles.resultButton, { backgroundColor: colors.surface }]}
            onPress={onBack}
          >
            <Text style={[styles.resultButtonText, { color: colors.textPrimary }]}>
              닫기
            </Text>
          </TouchableOpacity>
          {!isSuccess && (
            <TouchableOpacity
              style={[styles.resultButton, { backgroundColor: colors.primary }]}
              onPress={handleReset}
            >
              <Text style={[styles.resultButtonText, { color: '#000' }]}>
                다시 시도
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={step === 'select' ? onBack : handleReset} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>출금하기</Text>
        <View style={styles.backButton} />
      </View>

      {/* 단계별 컨텐츠 */}
      {step === 'select' && renderSelectStep()}
      {step === 'input' && renderInputStep()}
      {step === 'confirm' && renderConfirmStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'result' && renderResultStep()}

      {/* 경고 모달 */}
      <Modal
        visible={showWarningModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.warningModal, { backgroundColor: colors.surface }]}>
            <View style={[styles.warningIconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="warning" size={40} color={colors.warning} />
            </View>

            <Text style={[styles.warningModalTitle, { color: colors.textPrimary }]}>
              출금 전 확인사항
            </Text>

            <View style={styles.warningList}>
              <View style={styles.warningItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.warningItemText, { color: colors.textSecondary }]}>
                  받는 주소가 <Text style={{ fontWeight: FontWeight.bold }}>Ethereum 네트워크</Text>인지 확인하세요
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.warningItemText, { color: colors.textSecondary }]}>
                  다른 네트워크로 전송 시 <Text style={{ fontWeight: FontWeight.bold, color: colors.textRed }}>자산을 잃을 수 있습니다</Text>
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.warningItemText, { color: colors.textSecondary }]}>
                  출금 후에는 취소할 수 없습니다
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="확인했습니다"
              onPress={handleWarningConfirm}
            />

            <TouchableOpacity
              style={styles.warningCancelButton}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={[styles.warningCancelText, { color: colors.textMuted }]}>
                취소
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingTop: Spacing.lg,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: Spacing.xl,
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
    overflow: 'hidden',
  },
  assetLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  assetIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  assetNetwork: {
    fontSize: 12,
    marginTop: 2,
  },
  assetBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  balanceUsd: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  emptySubtext: {
    fontSize: 14,
  },
  // Selected Asset
  selectedAssetCard: {
    marginBottom: Spacing.lg,
  },
  selectedAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedAssetInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  selectedAssetName: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  selectedAssetBalance: {
    fontSize: 13,
    marginTop: 2,
  },
  changeButton: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  // Input
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  maxButton: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  // Gas
  gasCard: {
    marginBottom: Spacing.md,
  },
  gasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gasLabel: {
    fontSize: 14,
  },
  gasValue: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  sponsoredText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
  },
  gasNote: {
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  gasBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  // ETH Warning
  ethWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ethWarningContent: {
    flex: 1,
  },
  ethWarningTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  ethWarningText: {
    fontSize: 13,
    lineHeight: 20,
  },
  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  // Bottom Button
  bottomButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  // Confirm
  confirmCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  confirmAmountSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  confirmAmount: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  confirmAmountUsd: {
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  confirmDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  confirmDetails: {
    gap: Spacing.md,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 14,
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  finalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  finalWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  // Processing
  processingText: {
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
  },
  processingSubtext: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  // Result
  resultIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  resultAmount: {
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  resultSubtext: {
    fontSize: 14,
  },
  resultError: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  viewTxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  viewTxText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
    width: '100%',
  },
  resultButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  warningModal: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  warningModalTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  warningList: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  warningItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  warningCancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  warningCancelText: {
    fontSize: 14,
  },
});
