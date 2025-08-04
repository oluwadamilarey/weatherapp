import React, { memo, useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  Dimensions,
  Platform,
} from "react-native";
import { theme } from "../styles/theme";


interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  lastRequestTime: number | null;
  requestsPerMinute: number;
  errorRate: number;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  maxCacheSize: number;
  evictions: number;
  averageAge: number;
  memoryUsage: number; // in MB
}

interface MemoryMetrics {
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  gcCount: number;
  gcDuration: number;
}

interface NetworkMetrics {
  bytesReceived: number;
  bytesSent: number;
  compressionRatio: number;
  connectionCount: number;
  averageBandwidth: number;
}

interface RenderMetrics {
  frameDrops: number;
  averageFPS: number;
  renderTime: number;
  componentCount: number;
  reRenderCount: number;
}

interface SystemHealth {
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  lastHealthCheck: number;
  errors: Array<{
    timestamp: number;
    message: string;
    severity: "low" | "medium" | "high";
  }>;
}

interface PerformanceMetricsData {
  api: APIMetrics;
  cache: CacheMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  render: RenderMetrics;
  health: SystemHealth;
  timestamp: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRatio: number;
  keys: string[];
  totalMemory: number;
}

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsData;
  cacheStats: CacheStats;
  isHealthy: boolean;
  style?: ViewStyle;
  refreshInterval?: number;
}

// Metric card component for consistent styling
const MetricCard = memo<{
  title: string;
  children: React.ReactNode;
  status?: "good" | "warning" | "critical" | unknown;
  collapsible?: boolean;
}>(({ title, children, status = "good", collapsible = false }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setCollapsed((prev) => !prev);
    }
  }, [collapsible]);

  const statusColor = useMemo(() => {
    switch (status) {
      case "warning":
        return theme.colors.warning || "#FFA500";
      case "critical":
        return theme.colors.error;
      case "good":
      default:
        return theme.colors.success || "#4CAF50";
    }
  }, [status]);

  return (
    <TouchableOpacity
      style={[styles.metricCard, { borderLeftColor: statusColor }]}
      onPress={handleToggle}
      disabled={!collapsible}
      activeOpacity={collapsible ? 0.7 : 1}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {collapsible && (
          <Text style={styles.collapseIndicator}>{collapsed ? "▼" : "▲"}</Text>
        )}
      </View>
      {!collapsed && <View style={styles.cardContent}>{children}</View>}
    </TouchableOpacity>
  );
});

MetricCard.displayName = "MetricCard";

// Individual metric row component
const MetricRow = memo<{
  label: string;
  value: string | number;
  unit?: string;
  status?: string;
}>(({ label, value, unit = "", status = "good" }) => {
  const valueColor = useMemo(() => {
    switch (status) {
      case "warning":
        return theme.colors.warning || "#FFA500";
      case "critical":
        return theme.colors.error;
      case "good":
      default:
        return theme.colors.textPrimary;
    }
  }, [status]);

  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>
        {value}
        {unit}
      </Text>
    </View>
  );
});

MetricRow.displayName = "MetricRow";

// Format bytes for display
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format duration for display
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

// Format uptime for display
const formatUptime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// Main PerformanceMetrics component
export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = memo(
  ({ metrics, cacheStats, isHealthy, style }) => {
    const [selectedTab, setSelectedTab] = useState<"overview" | "detailed">(
      "overview"
    );

    // Calculate derived metrics
    const derivedMetrics = useMemo(() => {
      const { api, cache, memory, network, render } = metrics;

      return {
        apiHealth:
          api.errorRate < 0.05
            ? "good"
            : api.errorRate < 0.15
            ? "warning"
            : "critical",
        cacheEfficiency:
          cache.hitRate > 0.8
            ? "good"
            : cache.hitRate > 0.6
            ? "warning"
            : "critical",
        memoryPressure:
          memory.jsHeapSizeUsed / memory.jsHeapSizeLimit < 0.7
            ? "good"
            : memory.jsHeapSizeUsed / memory.jsHeapSizeLimit < 0.9
            ? "warning"
            : "critical",
        renderPerformance:
          render.averageFPS > 55
            ? "good"
            : render.averageFPS > 45
            ? "warning"
            : "critical",
        networkEfficiency:
          network.compressionRatio > 0.6
            ? "good"
            : network.compressionRatio > 0.4
            ? "warning"
            : "critical",
      };
    }, [metrics]);

    const handleTabChange = useCallback((tab: "overview" | "detailed") => {
      setSelectedTab(tab);
    }, []);

    const renderOverview = useCallback(
      () => (
        <View>
          <MetricCard
            title="System Health"
            status={isHealthy ? "good" : "critical"}
          >
            <MetricRow
              label="Status"
              value={metrics.health.status.toUpperCase()}
              status={isHealthy ? "good" : "critical"}
            />
            <MetricRow
              label="Uptime"
              value={formatUptime(metrics.health.uptime)}
            />
            <MetricRow
              label="Error Count"
              value={metrics.health.errors.length}
            />
          </MetricCard>

          <MetricCard title="API Performance" status={derivedMetrics.apiHealth}>
            <MetricRow
              label="Success Rate"
              value={`${((1 - metrics.api.errorRate) * 100).toFixed(1)}`}
              unit="%"
            />
            <MetricRow
              label="Avg Response"
              value={metrics.api.averageResponseTime.toFixed(0)}
              unit="ms"
            />
            <MetricRow
              label="Requests/min"
              value={metrics.api.requestsPerMinute.toFixed(1)}
            />
            <MetricRow
              label="P95 Response"
              value={metrics.api.p95ResponseTime.toFixed(0)}
              unit="ms"
            />
          </MetricCard>

          <MetricCard
            title="Cache Performance"
            status={derivedMetrics.cacheEfficiency}
          >
            <MetricRow
              label="Hit Rate"
              value={`${(cacheStats.hitRatio * 100).toFixed(1)}`}
              unit="%"
            />
            <MetricRow
              label="Size"
              value={`${cacheStats.size}/${cacheStats.maxSize}`}
            />
            <MetricRow
              label="Memory"
              value={formatBytes(cacheStats.totalMemory)}
            />
            <MetricRow label="Evictions" value={metrics.cache.evictions} />
          </MetricCard>

          <MetricCard
            title="Memory Usage"
            status={derivedMetrics.memoryPressure}
          >
            <MetricRow
              label="Heap Used"
              value={`${(
                (metrics.memory.jsHeapSizeUsed /
                  metrics.memory.jsHeapSizeLimit) *
                100
              ).toFixed(1)}`}
              unit="%"
            />
            <MetricRow label="GC Count" value={metrics.memory.gcCount} />
            <MetricRow
              label="GC Duration"
              value={formatDuration(metrics.memory.gcDuration)}
            />
          </MetricCard>
        </View>
      ),
      [metrics, cacheStats, isHealthy, derivedMetrics]
    );

    const renderDetailed = useCallback(
      () => (
        <View>
          <MetricCard
            title="Network Metrics"
            status={derivedMetrics.networkEfficiency}
            collapsible
          >
            <MetricRow
              label="Bytes Received"
              value={formatBytes(metrics.network.bytesReceived)}
            />
            <MetricRow
              label="Bytes Sent"
              value={formatBytes(metrics.network.bytesSent)}
            />
            <MetricRow
              label="Compression"
              value={`${(metrics.network.compressionRatio * 100).toFixed(1)}`}
              unit="%"
            />
            <MetricRow
              label="Avg Bandwidth"
              value={formatBytes(metrics.network.averageBandwidth)}
              unit="/s"
            />
            <MetricRow
              label="Connections"
              value={metrics.network.connectionCount}
            />
          </MetricCard>

          <MetricCard
            title="Render Performance"
            status={derivedMetrics.renderPerformance}
            collapsible
          >
            <MetricRow
              label="Average FPS"
              value={metrics.render.averageFPS.toFixed(1)}
            />
            <MetricRow label="Frame Drops" value={metrics.render.frameDrops} />
            <MetricRow
              label="Render Time"
              value={formatDuration(metrics.render.renderTime)}
            />
            <MetricRow
              label="Components"
              value={metrics.render.componentCount}
            />
            <MetricRow
              label="Re-renders"
              value={metrics.render.reRenderCount}
            />
          </MetricCard>

          <MetricCard title="Advanced Cache Stats" collapsible>
            <MetricRow
              label="Average Age"
              value={formatDuration(metrics.cache.averageAge)}
            />
            <MetricRow label="Cache Keys" value={cacheStats.keys.length} />
            <MetricRow
              label="Memory/Item"
              value={formatBytes(
                cacheStats.totalMemory / Math.max(cacheStats.size, 1)
              )}
            />
          </MetricCard>

          <MetricCard title="Memory Details" collapsible>
            <MetricRow
              label="Heap Total"
              value={formatBytes(metrics.memory.jsHeapSizeTotal)}
            />
            <MetricRow
              label="Heap Limit"
              value={formatBytes(metrics.memory.jsHeapSizeLimit)}
            />
            <MetricRow
              label="Cache Memory"
              value={formatBytes(metrics.cache.memoryUsage * 1024 * 1024)}
            />
          </MetricCard>

          {metrics.health.errors.length > 0 && (
            <MetricCard title="Recent Errors" status="critical" collapsible>
              {metrics.health.errors.slice(0, 3).map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Text style={styles.errorMessage} numberOfLines={2}>
                    {error.message}
                  </Text>
                  <Text style={styles.errorTime}>
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </MetricCard>
          )}
        </View>
      ),
      [metrics, cacheStats, derivedMetrics]
    );

    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance Metrics</Text>
          <Text style={styles.timestamp}>
            Updated: {new Date(metrics.timestamp).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "overview" && styles.activeTab]}
            onPress={() => handleTabChange("overview")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "overview" && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "detailed" && styles.activeTab]}
            onPress={() => handleTabChange("detailed")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "detailed" && styles.activeTabText,
              ]}
            >
              Detailed
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {selectedTab === "overview" ? renderOverview() : renderDetailed()}
        </ScrollView>
      </View>
    );
  }
);

PerformanceMetrics.displayName = "PerformanceMetrics";

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: Dimensions.get("window").height * 0.6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "400",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.surface,
  },
  content: {
    flex: 1,
  },
  metricCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  collapseIndicator: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cardContent: {
    gap: theme.spacing.xs,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorItem: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  errorMessage: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: 2,
  },
  errorTime: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
});

// Export types for external use
export type {
  PerformanceMetricsData,
  APIMetrics,
  CacheMetrics,
  MemoryMetrics,
  NetworkMetrics,
  RenderMetrics,
  SystemHealth,
  PerformanceMetricsProps,
};
