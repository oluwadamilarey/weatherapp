import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ViewStyle,
} from "react-native";
import { theme } from "../styles/theme";

// Types
interface SearchHistoryItem {
  id: string;
  city: string;
  timestamp: number;
  searchCount: number;
  lastWeatherData?: {
    temperature: number;
    condition: string;
  };
}

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelect: (city: string) => void;
  style?: ViewStyle;
  maxItems?: number;
  showMetadata?: boolean;
}

// Memoized history item component for optimal list performance
const HistoryItem = memo<{
  item: SearchHistoryItem;
  onSelect: (city: string) => void;
  showMetadata: boolean;
}>(({ item, onSelect, showMetadata }) => {
  const handlePress = useCallback(() => {
    onSelect(item.city);
  }, [item.city, onSelect]);

  const timeAgo = useMemo(() => {
    const now = Date.now();
    const diff = now - item.timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  }, [item.timestamp]);

  const searchFrequency = useMemo(() => {
    if (item.searchCount === 1) return "";
    if (item.searchCount < 5) return "⭐";
    if (item.searchCount < 10) return "⭐⭐";
    return "⭐⭐⭐";
  }, [item.searchCount]);

  return (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Search for ${item.city}`}
      accessibilityHint="Tap to search for this city again"
    >
      <View style={styles.itemContent}>
        <View style={styles.cityRow}>
          <Text style={styles.cityName} numberOfLines={1}>
            {item.city}
          </Text>
          {searchFrequency && (
            <Text style={styles.frequency}>{searchFrequency}</Text>
          )}
        </View>

        {showMetadata && (
          <View style={styles.metadata}>
            <Text style={styles.timeText}>{timeAgo}</Text>
            {item.lastWeatherData && (
              <Text style={styles.weatherPreview}>
                {Math.round(item.lastWeatherData.temperature)}° •{" "}
                {item.lastWeatherData.condition}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );
});

HistoryItem.displayName = "HistoryItem";

// Main SearchHistory component with performance optimizations
export const SearchHistory: React.FC<SearchHistoryProps> = memo(
  ({ history, onSelect, style, maxItems = 5, showMetadata = true }) => {
    // Memoized and sorted history data
    const sortedHistory = useMemo(() => {
      // Sort by frequency and recency, limit results
      return history
        .sort((a, b) => {
          // Primary sort: search frequency (higher first)
          const frequencyDiff = b.searchCount - a.searchCount;
          if (frequencyDiff !== 0) return frequencyDiff;

          // Secondary sort: recency (newer first)
          return b.timestamp - a.timestamp;
        })
        .slice(0, maxItems);
    }, [history, maxItems]);

    // Optimized renderItem with stable reference
    const renderItem = useCallback(
      ({ item }: { item: SearchHistoryItem }) => (
        <HistoryItem
          item={item}
          onSelect={onSelect}
          showMetadata={showMetadata}
        />
      ),
      [onSelect, showMetadata]
    );

    // Optimized keyExtractor
    const keyExtractor = useCallback((item: SearchHistoryItem) => item.id, []);

    // Performance optimized getItemLayout (if items have consistent height)
    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: showMetadata ? 64 : 48,
        offset: (showMetadata ? 64 : 48) * index,
        index,
      }),
      [showMetadata]
    );

    if (sortedHistory.length === 0) {
      return null;
    }

    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>Recent Searches</Text>

        <FlatList
          data={sortedHistory}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={maxItems}
          windowSize={1}
          initialNumToRender={maxItems}
          // Performance optimizations
          disableVirtualization={sortedHistory.length <= 10}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }
);

SearchHistory.displayName = "SearchHistory";

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: "transparent",
    // Optimize for touch targets
    minHeight: 44,
  },
  itemContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityName: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textPrimary,
    flex: 1,
  },
  frequency: {
    fontSize: 12,
    marginLeft: theme.spacing.xs,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: theme.spacing.sm,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "400",
  },
  weatherPreview: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "400",
  },
  chevron: {
    justifyContent: "center",
    alignItems: "center",
    width: 20,
    height: 20,
  },
  chevronText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: "300",
  },
});

// Export additional types for external use
export type { SearchHistoryItem, SearchHistoryProps };
