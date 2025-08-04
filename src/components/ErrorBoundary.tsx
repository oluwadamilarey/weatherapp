import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { theme } from "../styles/theme";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * error boundary with comprehensive error handling,
 * automatic recovery, and detailed error reporting
 */
export class WeatherErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    if (__DEV__) {
      console.group("🚨 Weather App Error Boundary");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to crash analytics service (production)
    this.reportError(error, errorInfo);

    // Attempt automatic recovery for certain error types
    this.attemptAutoRecovery(error);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Report error to analytics/monitoring service
   */
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, you would integrate with services like:
      // - Sentry
      // - Firebase Crashlytics
      // - Custom logging service

      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent || "Unknown",
        url: window.location?.href || "React Native App",
        retryCount: this.retryCount,
      };

      if (__DEV__) {
        console.log("Error Report:", errorReport);
      } else {
        // Send to monitoring service
        // crashAnalytics.recordError(errorReport);
      }
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
    }
  };

  /**
   * Attempt automatic recovery for certain error types
   */
  private attemptAutoRecovery = (error: Error) => {
    const recoverableErrors = [
      "ChunkLoadError",
      "Loading chunk",
      "Network request failed",
      "TypeError: Failed to fetch",
    ];

    const isRecoverable = recoverableErrors.some(
      (pattern) =>
        error.message.includes(pattern) || error.name.includes(pattern)
    );

    if (isRecoverable && this.retryCount < this.maxRetries) {
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, Math.pow(2, this.retryCount) * 1000); // Exponential backoff
    }
  };

  /**
   * Manual retry handler
   */
  private handleRetry = () => {
    this.retryCount++;

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  };

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    this.retryCount = 0;
    this.handleRetry();
  };

  /**
   * Show detailed error information (development only)
   */
  private showErrorDetails = () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorDetails = `
Error: ${this.state.error.message}

Stack Trace:
${this.state.error.stack}

Component Stack:
${this.state.errorInfo.componentStack}

Error ID: ${this.state.errorId}
Retry Count: ${this.retryCount}
    `.trim();

    Alert.alert(
      "Error Details",
      errorDetails,
      [
        {
          text: "Copy to Clipboard",
          onPress: () => {
            // In React Native, you'd use Clipboard API
            console.log("Error details copied to clipboard");
          },
        },
        { text: "Close", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.errorContainer}>
              {/* Error Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
              </View>

              {/* Error Message */}
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                The weather app encountered an unexpected error. We're working
                to fix this issue.
              </Text>

              {/* Error Details (Development) */}
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>
                    {this.state.error.name}: {this.state.error.message}
                  </Text>
                  <TouchableOpacity
                    onPress={this.showErrorDetails}
                    style={styles.detailsButton}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={this.handleRetry}
                  style={[styles.button, styles.primaryButton]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={this.handleReset}
                  style={[styles.button, styles.secondaryButton]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Reset App</Text>
                </TouchableOpacity>
              </View>

              {/* Retry Information */}
              {this.retryCount > 0 && (
                <Text style={styles.retryInfo}>
                  Retry attempt: {this.retryCount}/{this.maxRetries}
                </Text>
              )}

              {/* Error ID */}
              <Text style={styles.errorId}>Error ID: {this.state.errorId}</Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  errorContainer: {
    alignItems: "center",
    maxWidth: 400,
    alignSelf: "center",
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 64,
    textAlign: "center",
  },
  title: {
    fontSize: theme.typography.fontSize["3xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  errorDetails: {
    backgroundColor: theme.colors.errorTransparent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    width: "100%",
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  detailsButton: {
    alignSelf: "flex-start",
  },
  detailsButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  button: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  retryInfo: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.sm,
  },
  errorId: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary,
    fontFamily: "monospace",
  },
});
