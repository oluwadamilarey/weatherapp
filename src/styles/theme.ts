/**
 * Production-grade design system theme
 * Optimized for performance and maintainability
 */

// Color palette with semantic naming
const colors = {
  // Primary brand colors
  primary: "#2563EB",
  primaryLight: "#3B82F6",
  primaryDark: "#1D4ED8",

  // Secondary colors
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Neutral colors
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceVariant: "#F1F5F9",

  // Text colors
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",

  // Status colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Weather-specific colors
  weatherSun: "#F59E0B",
  weatherCloud: "#6B7280",
  weatherRain: "#3B82F6",
  weatherSnow: "#E5E7EB",
  weatherWind: "#8B5CF6",

  // Interactive states
  hover: "#F1F5F9",
  pressed: "#E2E8F0",
  focus: "#DBEAFE",
  disabled: "#F1F5F9",

  // Overlay and shadow
  overlay: "rgba(15, 23, 42, 0.6)",
  shadow: "rgba(15, 23, 42, 0.1)",

  // Transparent variants
  primaryTransparent: "rgba(37, 99, 235, 0.1)",
  successTransparent: "rgba(16, 185, 129, 0.1)",
  warningTransparent: "rgba(245, 158, 11, 0.1)",
  errorTransparent: "rgba(239, 68, 68, 0.1)",

  primaryTranslucent: "rgba(30, 58, 138, 0.7)", // Translucent for blur overlay

  backgroundTranslucent: "rgba(247, 250, 252, 0.8)", // Semi-transparent for blur
  // Light gray for secondary elements
};

// Typography scale with performance optimizations
const typography = {
  // Font families
  fontFamily: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },

  // Font sizes (rem-based for scalability)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },

  // Font weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
} as const;

// Spacing system (8pt grid)
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

// Border radius system
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

// Shadow system for elevation
const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
} as const;

// Animation durations and easing
const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
} as const;

// Breakpoints for responsive design
const breakpoints = {
  sm: 320,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Component-specific design tokens
const components = {
  button: {
    height: {
      sm: 32,
      md: 44,
      lg: 56,
    },
    paddingHorizontal: {
      sm: spacing.md,
      md: spacing.lg,
      lg: spacing.xl,
    },
  },
  input: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
} as const;

// Theme object with type safety
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  components,
} as const;

// Type definitions for theme
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeShadows = typeof shadows;

// Utility functions for common operations
export const getColor = (colorKey: keyof ThemeColors): string => {
  return colors[colorKey];
};

export const getSpacing = (spacingKey: keyof ThemeSpacing): number => {
  return spacing[spacingKey];
};

export const getShadow = (shadowKey: keyof ThemeShadows) => {
  return shadows[shadowKey];
};

// Weather condition color mapping
export const getWeatherColor = (condition: string): string => {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes("sun") || conditionLower.includes("clear")) {
    return colors.weatherSun;
  }
  if (conditionLower.includes("cloud")) {
    return colors.weatherCloud;
  }
  if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) {
    return colors.weatherRain;
  }
  if (conditionLower.includes("snow")) {
    return colors.weatherSnow;
  }
  if (conditionLower.includes("wind")) {
    return colors.weatherWind;
  }

  return colors.primary;
};

// Responsive utility
export const isTablet = (width: number): boolean => {
  return width >= breakpoints.md;
};

export const isDesktop = (width: number): boolean => {
  return width >= breakpoints.lg;
};

// Theme variants for different modes
export const darkTheme: Theme = {
  ...theme,
  colors: {
    ...colors,
    background: "#0F172A",
    surface: "#1E293B",
    surfaceVariant: "#334155",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    hover: "#334155",
    pressed: "#475569",
    focus: "#1E40AF",
    disabled: "#475569",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
};

// Export default theme
export default theme;
