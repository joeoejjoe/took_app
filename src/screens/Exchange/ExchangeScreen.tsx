import React, { useState, useMemo } from 'react';
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
import { PrimaryButton } from '../../components/common';
import ExchangeChart from '../../components/exchange/ExchangeChart';

type CurrencyType = 'USD' | 'KRW' | 'USDT' | 'USDC';

interface CurrencyOption {
  key: CurrencyType;
  label: string;
  flag: string;
}

const CURRENCIES: CurrencyOption[] = [
  { key: 'USD', label: 'USD', flag: '🇺🇸' },
  { key: 'KRW', label: 'KRW', flag: '🇰🇷' },
  { key: 'USDT', label: 'USDT', flag: '💵' },
  { key: 'USDC', label: 'USDC', flag: '💲' },
];

const MOCK_RATES: Record<string, number> = {
  'USD-KRW': 1320.50,
  'KRW-USD': 0.000757,
  'USD-USDT': 1.0,
  'USD-USDC': 1.0,
  'USDT-USDC': 1.0,
  'USDC-USDT': 1.0,
  'USDT-KRW': 1320.50,
  'USDC-KRW': 1320.50,
  'KRW-USDT': 0.000757,
  'KRW-USDC': 0.000757,
};

const MOCK_BALANCE: Record<CurrencyType, number> = {
  USD: 10012,
  KRW: 0,
  USDT: 5000,
  USDC: 3000,
};

export default function ExchangeScreen() {
  const colors = useColors();
  const [fromCurrency, setFromCurrency] = useState<CurrencyType>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyType>('KRW');
  const [fromAmount, setFromAmount] = useState('1000.00');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const numericAmount = parseFloat(fromAmount) || 0;

  const rate = useMemo(() => {
    const key = `${fromCurrency}-${toCurrency}`;
    return MOCK_RATES[key] || 1;
  }, [fromCurrency, toCurrency]);

  const toAmount = useMemo(() => {
    return numericAmount * rate;
  }, [numericAmount, rate]);

  const fee = 2.90;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount('');
  };

  const handleSelectFrom = (currency: CurrencyType) => {
    if (currency === toCurrency) {
      setToCurrency(fromCurrency);
    }
    setFromCurrency(currency);
    setShowFromPicker(false);
  };

  const handleSelectTo = (currency: CurrencyType) => {
    if (currency === fromCurrency) {
      setFromCurrency(toCurrency);
    }
    setToCurrency(currency);
    setShowToPicker(false);
  };

  const formatToAmount = (val: number): string => {
    if (val >= 1000) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    }
    return val.toFixed(2);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>간편하게 환전할 수 있어요.</Text>

        {/* From */}
        <View style={styles.exchangeSection}>
          <Text style={[styles.label, { color: colors.textMuted }]}>From</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => setShowFromPicker(!showFromPicker)}
            >
              <Text style={styles.flag}>
                {CURRENCIES.find((c) => c.key === fromCurrency)?.flag}
              </Text>
              <Text style={[styles.currencyText, { color: colors.textPrimary }]}>{fromCurrency}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={[styles.amountInput, { color: colors.textPrimary }]}
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <Text style={[styles.balanceText, { color: colors.textMuted }]}>
            보유 {MOCK_BALANCE[fromCurrency].toLocaleString()} {fromCurrency}
          </Text>

          {showFromPicker && (
            <View style={[styles.pickerDropdown, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={styles.pickerItem}
                  onPress={() => handleSelectFrom(c.key)}
                >
                  <Text style={styles.pickerFlag}>{c.flag}</Text>
                  <Text style={[
                    styles.pickerText,
                    { color: c.key === fromCurrency ? colors.primary : colors.textSecondary },
                    c.key === fromCurrency && styles.pickerTextActive,
                  ]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <TouchableOpacity
            style={[styles.swapButton, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            onPress={handleSwap}
          >
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* To */}
        <View style={styles.exchangeSection}>
          <Text style={[styles.label, { color: colors.textMuted }]}>To</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => setShowToPicker(!showToPicker)}
            >
              <Text style={styles.flag}>
                {CURRENCIES.find((c) => c.key === toCurrency)?.flag}
              </Text>
              <Text style={[styles.currencyText, { color: colors.textPrimary }]}>{toCurrency}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.toAmountText, { color: colors.textPrimary }]}>{formatToAmount(toAmount)}</Text>
          </View>

          {showToPicker && (
            <View style={[styles.pickerDropdown, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={styles.pickerItem}
                  onPress={() => handleSelectTo(c.key)}
                >
                  <Text style={styles.pickerFlag}>{c.flag}</Text>
                  <Text style={[
                    styles.pickerText,
                    { color: c.key === toCurrency ? colors.primary : colors.textSecondary },
                    c.key === toCurrency && styles.pickerTextActive,
                  ]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Total Fees */}
        <View style={styles.feeContainer}>
          <Text style={[styles.feeText, { color: colors.textSecondary }]}>Total Fees {fee.toFixed(2)} USD</Text>
          <View style={[styles.feeSaveBadge, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.feeSaveText, { color: colors.primary }]}>
              Save at least 0.00 USD Compared to Bank and other providers
            </Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <ExchangeChart
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
          />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <PrimaryButton
          title="Exchange"
          onPress={() => {}}
          disabled={numericAmount <= 0}
        />
      </View>
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
  exchangeSection: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderWidth: 1,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  currencyText: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },
  toAmountText: {
    flex: 1,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },
  balanceText: {
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  pickerDropdown: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
  },
  pickerFlag: {
    fontSize: 18,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  pickerTextActive: {
    fontWeight: FontWeight.semibold,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  feeContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  feeText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  feeSaveBadge: {
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  feeSaveText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  chartSection: {
    marginTop: Spacing.xl,
    marginBottom: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: 1,
  },
});
