import {
  WeatherApiResponse,
  WeatherData,
  WeatherError,
  CityName,
  ApiKey,
  IconCode,
  isWeatherApiResponse,
} from "../types/weather";

// Configuration
const API_BASE_URL = "https://api.openweathermap.org/data/2.5";
const API_KEY = "258093b4093c29ffdb8f0257c66de0bf";
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Custom error classes for better error handling
export class NetworkError extends Error implements WeatherError {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error implements WeatherError {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ApiError extends Error implements WeatherError {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Circuit breaker implementation for API resilience
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new NetworkError("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}

// Retry mechanism with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
};

// Request timeout utility
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new NetworkError("Request timeout", undefined, "TIMEOUT"));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
};

// Main API service class
export class WeatherApiService {
  private circuitBreaker = new CircuitBreaker();
  private abortController: AbortController | null = null;

  // Cancel any ongoing requests
  cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Validate city name
  private validateCityName(city: string): asserts city is CityName {
    if (!city || typeof city !== "string") {
      throw new ValidationError("City name is required");
    }

    if (city.length > 100) {
      throw new ValidationError("City name is too long");
    }

    if (!/^[a-zA-Z\s\-',.]+$/.test(city)) {
      throw new ValidationError("Invalid city name format");
    }
  }

  // Transform API response to internal format
  private transformWeatherData(response: WeatherApiResponse): WeatherData {
    const weather = response.weather[0];

    return {
      cityName: response.name,
      temperature: Math.round(response.main.temp),
      description: weather.description,
      humidity: response.main.humidity,
      windSpeed: response.wind.speed,
      windSpeedKmh: Math.round(response.wind.speed * 3.6),
      pressure: response.main.pressure,
      feelsLike: Math.round(response.main.feels_like),
      icon: weather.icon as IconCode,
      country: response.sys.country,
      timestamp: Date.now(),
    };
  }

  // Main fetch weather method
  async fetchWeather(city: string): Promise<WeatherData> {
    this.validateCityName(city);

    // Cancel previous request
    this.cancelRequests();
    this.abortController = new AbortController();

    const url = new URL(`${API_BASE_URL}/weather`);
    url.searchParams.set("q", city);
    url.searchParams.set("appid", API_KEY);
    url.searchParams.set("units", "metric");

    const fetchWeatherData = async (): Promise<WeatherData> => {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        switch (response.status) {
          case 404:
            throw new ApiError("City not found", 404, "CITY_NOT_FOUND");
          case 401:
            throw new ApiError("Invalid API key", 401, "INVALID_API_KEY");
          case 429:
            throw new ApiError("Rate limit exceeded", 429, "RATE_LIMIT");
          case 500:
          case 502:
          case 503:
          case 504:
            throw new ApiError("Server error", response.status, "SERVER_ERROR");
          default:
            throw new ApiError(
              errorData.message || "Unknown API error",
              response.status,
              "UNKNOWN_ERROR"
            );
        }
      }

      const data = await response.json();

      if (!isWeatherApiResponse(data)) {
        throw new ValidationError("Invalid API response format");
      }

      return this.transformWeatherData(data);
    };

    // Apply circuit breaker, retry logic, and timeout
    return this.circuitBreaker.call(() =>
      retryWithBackoff(() => withTimeout(fetchWeatherData(), REQUEST_TIMEOUT))
    );
  }

  // Get weather icon URL
  getIconUrl(iconCode: IconCode): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchWeather("London" as CityName);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const weatherApiService = new WeatherApiService();

// Export convenience method
export const fetchWeather = (city: CityName): Promise<WeatherData> =>
  weatherApiService.fetchWeather(city);
