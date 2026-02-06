import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontWeight, Spacing } from '../../constants';
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>Name</Text>
          <Text style={[styles.sortIcon, { color: colors.textMuted }]}> ↑↓</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {displayedAssets.map((asset) => (
        <AssetListItem key={asset.id} asset={asset} onPress={onAssetPress} />
      ))}

      {hasMore && (
        <TouchableOpacity style={styles.moreButton} onPress={() => setShowAll(true)}>
          <Text style={[styles.moreText, { color: colors.textMuted }]}>+ More</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  sortIcon: {
    fontSize: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  moreButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  moreText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
});
