import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import AssetListItem, { AssetData } from './AssetListItem';

const INITIAL_SHOW_COUNT = 4;

interface AssetListProps {
  assets: AssetData[];
  onAssetPress: (asset: AssetData) => void;
  onSeeAll: () => void;
}

export default function AssetList({ assets, onAssetPress, onSeeAll }: AssetListProps) {
  const colors = useColors();
  const [showAll, setShowAll] = useState(false);

  const displayedAssets = showAll ? assets : assets.slice(0, INITIAL_SHOW_COUNT);
  const hasMore = assets.length > INITIAL_SHOW_COUNT && !showAll;

  return (
    <View style={styles.container}>
      {/* 섹션 헤더 */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="wallet-outline" size={18} color={colors.warning} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            미예치 자산
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          예치하면 이자 수익을 받을 수 있어요
        </Text>
      </View>

      {/* 자산 목록 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textMuted }]}>보유 자산</Text>
        <Text style={[styles.headerTitle, { color: colors.textMuted }]}>예치 시 예상 연 수익</Text>
      </View>

      {displayedAssets.map((asset) => (
        <AssetListItem key={asset.id} asset={asset} onPress={onAssetPress} />
      ))}

      {hasMore && (
        <TouchableOpacity style={styles.moreButton} onPress={() => setShowAll(true)}>
          <Text style={[styles.moreText, { color: colors.textMuted }]}>+ More</Text>
        </TouchableOpacity>
      )}

      {/* 예치하기 버튼 */}
      <TouchableOpacity
        style={[styles.depositButton, { backgroundColor: colors.primaryBg }]}
        onPress={onSeeAll}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={18} color={colors.primary} />
        <Text style={[styles.depositButtonText, { color: colors.primary }]}>
          상품 보고 예치하기
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: FontWeight.bold,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 12,
  },
  moreButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  moreText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  depositButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
});
