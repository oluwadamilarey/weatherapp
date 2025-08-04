export type CityName = string & { readonly __brand: unique symbol };
export type ApiKey = string & { readonly __brand: unique symbol };
export type IconCode = string & { readonly __brand: unique symbol };

export interface WeatherCondition {
  readonly main: string;
  readonly description: string;
  readonly icon: IconCode;
}

export interface MainWeatherData {
  readonly temp: number;
  readonly feels_like: number;
  readonly temp_min: number;
  readonly temp_max: number;
  readonly pressure: number;
  readonly humidity: number;
}

export interface WindData {
  readonly speed: number;
  readonly deg: number;
  readonly gust?: number;
}

export interface CloudData {
  readonly all: number;
}

export interface SysData {
  readonly type: number;
  readonly id: number;
  readonly country: string;
  readonly sunrise: number;
  readonly sunset: number;
}

export interface WeatherApiResponse {
  readonly coord: {
    readonly lon: number;
    readonly lat: number;
  };
  readonly weather: ReadonlyArray<WeatherCondition>;
  readonly base: string;
  readonly main: MainWeatherData;
  readonly visibility: number;
  readonly wind: WindData;
  readonly clouds: CloudData;
  readonly dt: number;
  readonly sys: SysData;
  readonly timezone: number;
  readonly id: number;
  readonly name: string;
  readonly cod: number;
}

export interface WeatherData {
  readonly cityName: string;
  readonly temperature: number;
  readonly description: string;
  readonly humidity: number;
  readonly windSpeed: number;
  readonly windSpeedKmh: number;
  readonly pressure: number;
  readonly feelsLike: number;
  readonly icon: IconCode;
  readonly country: string;
  readonly timestamp: number;
}

export interface CacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
  readonly expiresAt: number;
}

export interface WeatherError extends Error {
  readonly code?: string;
  readonly status?: number;
}

export interface WeatherState {
  readonly data: WeatherData | null;
  readonly loading: boolean;
  readonly error: WeatherError | null;
  readonly metrics: {
    readonly requestCount: number;
    readonly averageResponseTime: number;
    readonly cacheHitRate: number;
  };
}

export interface SearchHistory {
  readonly city: CityName;
  readonly timestamp: number;
  readonly data: WeatherData;
}

// Utility types for performance monitoring
export interface PerformanceMetrics {
  readonly apiResponseTime: number;
  readonly renderTime: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly errorCount: number;
}

// Type guards
export const isCityName = (value: string): value is CityName => {
  return typeof value === "string" && value.length > 0 && value.length <= 100;
};

export const isApiKey = (value: string): value is ApiKey => {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
};

export const isWeatherApiResponse = (obj: any): obj is WeatherApiResponse => {
  return (
    obj &&
    typeof obj === "object" &&
    Array.isArray(obj.weather) &&
    obj.main &&
    typeof obj.main.temp === "number" &&
    obj.wind &&
    typeof obj.wind.speed === "number" &&
    typeof obj.name === "string"
  );
};
