import React, { memo, useRef, useCallback, useState, use } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Keyboard,
} from "react-native";
import { theme } from "../styles/theme";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  loading?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = memo(
  ({
    value,
    onChangeText,
    onSubmit,
    placeholder = "Search for a city...",
    loading = false,
    error = false,
    autoFocus = false,
    disabled = false,
  }) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Animated values for smooth transitions
    const borderColorAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Handle focus events with animations
    const handleFocus = useCallback(() => {
      setIsFocused(true);

      Animated.parallel([
        Animated.timing(borderColorAnim, {
          toValue: 1,
          duration: theme.animation.duration.fast,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
    }, [borderColorAnim, scaleAnim]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);

      Animated.parallel([
        Animated.timing(borderColorAnim, {
          toValue: 0,
          duration: theme.animation.duration.fast,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
    }, [borderColorAnim, scaleAnim]);

    // Handle submission
    const handleSubmit = useCallback(() => {
      if (onSubmit && value.trim().length > 0) {
        Keyboard.dismiss();
        onSubmit();
      }
    }, [onSubmit, value]);

    // Handle clear action
    const handleClear = useCallback(() => {
      onChangeText("");
      inputRef.current?.focus();
    }, [onChangeText]);

    // Animated border color based on state
    const animatedBorderColor = borderColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        error ? theme.colors.error : theme.colors.surfaceVariant,
        error ? theme.colors.error : theme.colors.primary,
      ],
    });

    // Animated background color
    const animatedBackgroundColor = borderColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.surface, theme.colors.focus],
    });

    return (
      <Animated.View
        style={[
          styles.container,
          {
            borderColor: animatedBorderColor,
            backgroundColor: animatedBackgroundColor,
            transform: [{ scale: scaleAnim }],
          },
          disabled && styles.disabled,
        ]}
      >
        {/* Search Icon */}
        <View style={styles.searchIconContainer}>
          <SearchIcon
            color={
              isFocused ? theme.colors.primary : theme.colors.textSecondary
            }
            size={20}
          />
        </View>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          returnKeyType="search"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
          autoFocus={autoFocus}
          editable={!disabled && !loading}
          blurOnSubmit={true}
          clearButtonMode={Platform.OS === "ios" ? "while-editing" : "never"}
          underlineColorAndroid="transparent"
          selectionColor={theme.colors.primary}
          maxLength={100}
        />

        {/* Clear Button (Android) */}
        {Platform.OS === "android" && value.length > 0 && !loading && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <ClearIcon color={theme.colors.textSecondary} size={16} />
          </TouchableOpacity>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="small" color={theme.colors.primary} />
          </View>
        )}

        {/* Submit Button */}
        {!loading && value.trim().length > 0 && (
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              isFocused && styles.submitButtonFocused,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <SubmitIcon
              color={isFocused ? theme.colors.surface : theme.colors.primary}
              size={18}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }
);

SearchInput.displayName = "SearchInput";

// Icon components for better performance
const SearchIcon: React.FC<{ color: string; size: number }> = memo(
  ({ color, size }) => (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* SVG search icon would go here - using placeholder */}
      <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
    </View>
  )
);

const ClearIcon: React.FC<{ color: string; size: number }> = memo(
  ({ color, size }) => (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* SVG clear icon would go here - using placeholder */}
      <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
    </View>
  )
);

const SubmitIcon: React.FC<{ color: string; size: number }> = memo(
  ({ color, size }) => (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* SVG submit icon would go here - using placeholder */}
      <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
    </View>
  )
);

// Simple loading spinner component
const LoadingSpinner: React.FC<{ size: "small" | "large"; color?: string }> =
  memo(({ size, color = theme.colors.primary }) => {
    const spinValue = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );

      spinAnimation.start();

      return () => spinAnimation.stop();
    }, [spinValue]);

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    const spinnerSize = size === "small" ? 16 : 24;

    return (
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderColor: `${color}20`,
            borderTopColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
    );
  });

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.md,
    height: theme.components.input.height.md,
    ...theme.shadows.sm,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.disabled,
  },
  searchIconContainer: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.normal,
    paddingVertical: 0, // Remove default padding
    ...Platform.select({
      android: {
        paddingTop: 0,
        paddingBottom: 0,
      },
    }),
  },
  inputError: {
    color: theme.colors.error,
  },
  inputDisabled: {
    color: theme.colors.textTertiary,
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  loadingContainer: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  submitButton: {
    backgroundColor: theme.colors.primaryTransparent,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.xs,
  },
  submitButtonFocused: {
    backgroundColor: theme.colors.primary,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    width: "60%",
    height: "60%",
    borderRadius: 2,
    opacity: 0.8,
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 12,
  },
});
