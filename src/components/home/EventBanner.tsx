import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ViewToken,
} from 'react-native';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_MARGIN = Spacing.lg * 2;

export interface EventData {
  id: string;
  title: string;
  endDate: string;
  backgroundColor?: string;
}

interface EventBannerProps {
  events: EventData[];
  onEventPress: (event: EventData) => void;
}

export default function EventBanner({ events, onEventPress }: EventBannerProps) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = ({ item }: { item: EventData }) => (
    <TouchableOpacity
      style={[
        styles.banner,
        { backgroundColor: item.backgroundColor || colors.card },
      ]}
      onPress={() => onEventPress(item)}
      activeOpacity={0.8}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.date, { color: colors.textMuted }]}>{item.endDate}</Text>
    </TouchableOpacity>
  );

  if (events.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />
      {events.length > 1 && (
        <View style={styles.pagination}>
          {events.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex
                    ? colors.primary
                    : colors.borderMuted,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  banner: {
    width: SCREEN_WIDTH - BANNER_MARGIN,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  date: {
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
