import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, View, Text } from "react-native";
import { WeatherErrorBoundary } from "./src/components/ErrorBoundary";
import { WeatherApp } from "./src/components/weatherApp";
import { theme } from "./src/styles/theme";

const App: React.FC = () => {
  return (
    <WeatherErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary}
        />
        <View style={styles.header}>
          <Text style={styles.title}>Weather App</Text>
          <Text style={styles.subtitle}>Beta weather data</Text>
        </View>
        <WeatherApp />
      </SafeAreaView>
    </WeatherErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.surface,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.surfaceVariant,
    marginTop: theme.spacing.xs,
    fontWeight: "400",
  },
});

export default App;
