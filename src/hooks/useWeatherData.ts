import { useState, useCallback, useRef, useEffect } from "react";
import {
  WeatherState,
  WeatherData,
  WeatherError,
  CityName,
  SearchHistory,
} from "../types/weather";
import { weatherApiService } from "../services/weatherApi";
import { CacheManager } from "../services/cache";

// Cache configuration
const CACHE_TTL = 300000; // 5 minutes
const MAX_CACHE_SIZE = 50;
const MAX_SEARCH_HISTORY = 10;

// Performance monitoring
interface PerformanceTracker {
  startTime: number;
  endTime?: number;
  operation: string;
}

/**
 * High-performance weather data hook with caching, error handling,
 * and performance monitoring
 */
export const useWeatherData = () => {
  // State management
  const [state, setState] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
    metrics: {
      requestCount: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
    },
  });

  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Refs for performance tracking and cleanup
  const cacheRef = useRef<CacheManager<string, WeatherData>>(undefined);
  const performanceTrackerRef = useRef<PerformanceTracker | null>(null);
  const responseTimesRef = useRef<number[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize cache
  if (!cacheRef.current) {
    cacheRef.current = new CacheManager<string, WeatherData>(
      MAX_CACHE_SIZE,
      CACHE_TTL
    );
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cacheRef.current?.destroy();
      abortControllerRef.current?.abort();
    };
  }, []);

  // Performance tracking utilities
  const startPerformanceTracking = useCallback((operation: string) => {
    performanceTrackerRef.current = {
      startTime: performance.now(),
      operation,
    };
  }, []);

  const endPerformanceTracking = useCallback(() => {
    if (performanceTrackerRef.current) {
      const endTime = performance.now();
      const responseTime = endTime - performanceTrackerRef.current.startTime;

      responseTimesRef.current.push(responseTime);

      // Keep only last 100 response times for rolling average
      if (responseTimesRef.current.length > 100) {
        responseTimesRef.current = responseTimesRef.current.slice(-100);
      }

      performanceTrackerRef.current = null;
      return responseTime;
    }
    return 0;
  }, []);

  // Calculate average response time
  const getAverageResponseTime = useCallback((): number => {
    const times = responseTimesRef.current;
    return times.length > 0
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;
  }, []);

  // Update search history
  const updateSearchHistory = useCallback(
    (city: CityName, data: WeatherData) => {
      setSearchHistory((prev) => {
        const newEntry: SearchHistory = {
          city,
          timestamp: Date.now(),
          data,
        };

        // Remove existing entry for the same city
        const filtered = prev.filter((entry) => entry.city !== city);

        // Add new entry at the beginning and limit size
        return [newEntry, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      });
    },
    []
  );

  // Main fetch weather function with comprehensive error handling
  const fetchWeather = useCallback(
    async (city: string) => {
      if (!city || typeof city !== "string" || city.trim().length === 0) {
        setState((prev) => ({
          ...prev,
          error: new Error("City name is required") as WeatherError,
        }));
        return;
      }

      const normalizedCity = city.trim().toLowerCase();
      const cityName = city.trim() as CityName;

      // Cancel previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // Start performance tracking
      startPerformanceTracking("fetchWeather");

      // Set loading state
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        // Check cache first
        const cachedData = cacheRef.current?.get(normalizedCity);
        if (cachedData) {
          const responseTime = endPerformanceTracking();

          setState((prev) => ({
            ...prev,
            data: cachedData,
            loading: false,
            metrics: {
              ...prev.metrics,
              cacheHitRate: cacheRef.current?.getHitRate() || 0,
            },
          }));

          updateSearchHistory(cityName, cachedData);
          return;
        }

        // Fetch from API
        const weatherData = await weatherApiService.fetchWeather(cityName);
        const responseTime = endPerformanceTracking();

        // Cache the result
        cacheRef.current?.set(normalizedCity, weatherData);

        // Update state with new data and metrics
        setState((prev) => ({
          ...prev,
          data: weatherData,
          loading: false,
          metrics: {
            requestCount: prev.metrics.requestCount + 1,
            averageResponseTime: getAverageResponseTime(),
            cacheHitRate: cacheRef.current?.getHitRate() || 0,
          },
        }));

        // Update search history
        updateSearchHistory(cityName, weatherData);
      } catch (error) {
        endPerformanceTracking();

        // Handle abort errors gracefully
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        // Transform error to WeatherError
        const weatherError: WeatherError =
          error instanceof Error
            ? (error as WeatherError)
            : (new Error("Unknown error occurred") as WeatherError);

        setState((prev) => ({
          ...prev,
          loading: false,
          error: weatherError,
          metrics: {
            ...prev.metrics,
            requestCount: prev.metrics.requestCount + 1,
            averageResponseTime: getAverageResponseTime(),
          },
        }));
      }
    },
    [
      startPerformanceTracking,
      endPerformanceTracking,
      getAverageResponseTime,
      updateSearchHistory,
    ]
  );

  // Clear error state
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Clear data and reset state
  const clearData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      data: null,
      error: null,
    }));
  }, []);

  // Get cached cities
  const getCachedCities = useCallback((): string[] => {
    return (cacheRef.current?.getStats()?.size ?? 0) > 0
      ? Array.from(new Set(searchHistory.map((h) => h.city)))
      : [];
  }, [searchHistory]);

  // Refresh current city data
  const refreshCurrentCity = useCallback(async () => {
    if (state.data?.cityName) {
      await fetchWeather(state.data.cityName);
    }
  }, [state.data?.cityName, fetchWeather]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return (
      cacheRef.current?.getStats() || {
        size: 0,
        maxSize: MAX_CACHE_SIZE,
        hitRate: 0,
        hitCount: 0,
        missCount: 0,
        oldestEntry: null,
        newestEntry: null,
      }
    );
  }, []);

  return {
    // State
    ...state,
    searchHistory,

    // Actions
    fetchWeather,
    clearError,
    clearData,
    refreshCurrentCity,

    // Utilities
    getCachedCities,
    getCacheStats,

    // Performance metrics
    isHealthy: !state.error && state.metrics.averageResponseTime < 5000,
  };
};
