import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Vibration,
  Text,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SearchInput } from "./SearchInput";
import { WeatherCard } from "./WeatherCard";
import { SearchHistory } from "./SearchHistory";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { useWeatherData } from "../hooks/useWeatherData";
import { useSearchDebounce } from "../hooks/useDebounce";
import { theme } from "../styles/theme";

export const WeatherApp: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showMetrics, setShowMetrics] = useState(false);

  // Weather data hook with performance monitoring
  const {
    data,
    loading,
    error,
    searchHistory,
    metrics,
    fetchWeather,
    clearError,
    refreshCurrentCity,
    getCacheStats,
    isHealthy,
  } = useWeatherData();

  // Debounced search with minimum length validation
  const { debouncedSearchTerm, shouldSearch } = useSearchDebounce(
    searchTerm,
    300,
    4
  );

  // Auto-search when debounced term changes
  React.useEffect(() => {
    if (shouldSearch && debouncedSearchTerm) {
      fetchWeather(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, shouldSearch, fetchWeather]);

  // Handle search input changes
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchTerm(text);

      // Clear error when user starts typing
      if (error) {
        clearError();
      }
    },
    [error, clearError]
  );

  // Handle search submission (immediate search)
  const handleSearchSubmit = useCallback(() => {
    if (searchTerm.trim().length >= 2) {
      fetchWeather(searchTerm.trim());

      // Haptic feedback on iOS
      if (Platform.OS === "ios") {
        Vibration.vibrate(50);
      }
    }
  }, [searchTerm, fetchWeather]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refreshCurrentCity();
    } catch (refreshError) {
      Alert.alert(
        "Refresh Failed",
        "Unable to refresh weather data. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, [refreshCurrentCity]);

  // Handle search history selection
  const handleHistorySelect = useCallback(
    (city: string) => {
      setSearchTerm(city);
      fetchWeather(city);
    },
    [fetchWeather]
  );

  // Handle error retry
  const handleRetry = useCallback(() => {
    if (searchTerm.trim()) {
      fetchWeather(searchTerm.trim());
    }
  }, [searchTerm, fetchWeather]);

  // Toggle performance metrics visibility
  const toggleMetrics = useCallback(() => {
    setShowMetrics((prev) => !prev);
  }, []);

  // Memoized cache stats for performance
  const cacheStats = useMemo(() => getCacheStats(), [getCacheStats, data]);

  // Render error state
  const renderErrorState = useCallback(() => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error.message || "Unable to fetch weather data"}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }, [error, handleRetry]);

  // Render loading state
  const renderLoadingState = useCallback(() => {
    if (!loading) return null;

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Fetching weather data...</Text>
      </View>
    );
  }, [loading]);

  // Render main content
  const renderContent = useCallback(() => {
    if (loading) {
      return renderLoadingState();
    }

    if (error) {
      return renderErrorState();
    }

    if (data) {
      return (
        <WeatherCard
          data={data}
          onRefresh={handleRefresh}
          isRefreshing={loading}
        />
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>Welcome to Weather App</Text>
        <Text style={styles.emptyStateMessage}>
          Search for a city to get started
        </Text>
      </View>
    );
  }, [
    loading,
    error,
    data,
    handleRefresh,
    renderLoadingState,
    renderErrorState,
  ]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchTerm}
          onChangeText={handleSearchChange}
          onSubmit={handleSearchSubmit}
          placeholder="Search for a city..."
          loading={loading}
          error={!!error}
        />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            enabled={!!data}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}

        {/* Search History */}
        {searchHistory.length > 0 && !loading && (
          <SearchHistory
            history={searchHistory}
            onSelect={handleHistorySelect}
            style={styles.historyContainer}
          />
        )}

        {/* Performance Metrics (Debug Mode)
        {showMetrics && (
          <PerformanceMetrics
            metrics={metrics}
            cacheStats={cacheStats}
            isHealthy={isHealthy}
            style={styles.metricsContainer}
          />
        )} */}
      </ScrollView>

      {/* Debug Toggle (Development only) */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={toggleMetrics}
          activeOpacity={0.7}
        >
          <Text style={styles.debugToggleText}>
            {showMetrics ? "Hide" : "Show"} Metrics
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl * 2,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl * 3,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  emptyStateMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  historyContainer: {
    marginTop: theme.spacing.xl,
  },
  metricsContainer: {
    marginTop: theme.spacing.xl,
  },
  debugToggle: {
    position: "absolute",
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    opacity: 0.8,
  },
  debugToggleText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: "500",
  },
});
