import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
//import { WeatherData } from "../types/weather";
import { weatherApiService } from "../services/weatherApi";
import { theme, getWeatherColor } from "../styles/theme";

interface WeatherCardProps {
  //data: WeatherData;
  data: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface WeatherMetricProps {
  label: string;
  value: string;
  unit?: string;
  icon?: string;
}

// Memoized weather metric component for performance
const WeatherMetric: React.FC<WeatherMetricProps> = memo(
  ({ label, value, unit, icon }) => (
    <View style={styles.metricContainer}>
      <View style={styles.metricHeader}>
        {icon && <Text style={styles.metricIcon}>{icon}</Text>}
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricValueContainer}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit && <Text style={styles.metricUnit}>{unit}</Text>}
      </View>
    </View>
  )
);

WeatherMetric.displayName = "WeatherMetric";

// Main weather card component
export const WeatherCard: React.FC<WeatherCardProps> = memo(
  ({ data, onRefresh, isRefreshing = false }) => {
    // Memoized calculations for performance
    const weatherIconUrl = useMemo(
      () => weatherApiService.getIconUrl(data.icon),
      [data.icon]
    );

    const weatherColor = useMemo(
      () => getWeatherColor(data.description),
      [data.description]
    );

    const formattedDescription = useMemo(
      () =>
        data.description.replace(/\b\w/g, (char: string) => char.toUpperCase()),
      [data.description]
    );

    const lastUpdated = useMemo(() => {
      const now = Date.now();
      const diffMinutes = Math.floor((now - data.timestamp) / (1000 * 60));

      if (diffMinutes < 1) {
        return "Just now";
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours}h ago`;
      }
    }, [data.timestamp]);

    // Memoized weather metrics
    const weatherMetrics = useMemo(
      () => [
        {
          label: "Feels like",
          value: `${data.feelsLike}`,
          unit: "°C",
          icon: "🌡️",
        },
        {
          label: "Humidity",
          value: `${data.humidity}`,
          unit: "%",
          icon: "💧",
        },
        {
          label: "Wind Speed",
          value: `${data.windSpeedKmh}`,
          unit: "km/h",
          icon: "💨",
        },
        {
          label: "Pressure",
          value: `${data.pressure}`,
          unit: "hPa",
          icon: "⏲️",
        },
      ],
      [data.feelsLike, data.humidity, data.windSpeedKmh, data.pressure]
    );

    return (
      <View style={styles.container}>
        {/* Main weather display */}
        <View style={[styles.mainCard, { borderLeftColor: weatherColor }]}>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={isRefreshing}
            style={styles.mainContent}
            activeOpacity={0.8}
          >
            {/* Location and time */}
            <View style={styles.header}>
              <View style={styles.locationContainer}>
                <Text style={styles.cityName}>{data.cityName}</Text>
                <Text style={styles.country}>{data.country}</Text>
              </View>
              <Text style={styles.lastUpdated}>
                {isRefreshing ? "Updating..." : lastUpdated}
              </Text>
            </View>

            {/* Temperature and weather icon */}
            <View style={styles.temperatureSection}>
              <View style={styles.temperatureContainer}>
                <Text style={styles.temperature}>{data.temperature}</Text>
                <Text style={styles.temperatureUnit}>°C</Text>
              </View>

              <View style={styles.weatherIconContainer}>
                <Image
                  source={{ uri: weatherIconUrl }}
                  style={styles.weatherIcon}
                  resizeMode="contain"
                  // Performance optimizations
                  // cache="force-cache"
                  loadingIndicatorSource={require("../../assets/adaptive-icon.png")}
                />
              </View>
            </View>

            {/* Weather description */}
            <Text style={[styles.description, { color: weatherColor }]}>
              {formattedDescription}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weather metrics grid */}
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>Details</Text>
          <View style={styles.metricsGrid}>
            {weatherMetrics.map((metric, index) => (
              <WeatherMetric key={`${metric.label}-${index}`} {...metric} />
            ))}
          </View>
        </View>

        {/* Refresh hint */}
        {onRefresh && (
          <Text style={styles.refreshHint}>
            Tap the weather card to refresh
          </Text>
        )}
      </View>
    );
  }
);

WeatherCard.displayName = "WeatherCard";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderLeftWidth: 4,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
    overflow: "hidden",
  },
  mainContent: {
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  locationContainer: {
    flex: 1,
  },
  cityName: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  country: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: theme.typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
  lastUpdated: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    fontWeight: theme.typography.fontWeight.normal,
  },
  temperatureSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  temperatureContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  temperature: {
    fontSize: theme.typography.fontSize["5xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.fontSize["5xl"] * 1.1,
  },
  temperatureUnit: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  weatherIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  description: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: "center",
    letterSpacing: theme.typography.letterSpacing.normal,
  },
  metricsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  metricsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricContainer: {
    width: "48%",
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...Platform.select({
      ios: theme.shadows.sm,
      //android: { elevation: 1 },
    }),
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  metricIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  metricUnit: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.normal,
  },
  refreshHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: "center",
    marginTop: theme.spacing.md,
    fontStyle: "italic",
  },
});
