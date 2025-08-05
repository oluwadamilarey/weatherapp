# Weather App - React Native

A production-grade weather app built with React Native, TypeScript, and advanced performance optimizations.

## Features

- Real-time weather data from OpenWeatherMap API
- Debounced search with smart caching
- Offline support with LRU cache
- TypeScript for type safety
- Performance monitoring and metrics
- Clean, responsive UI design
- Error handling with retry mechanisms

## Tech Stack

- React Native with TypeScript
- Custom hooks for state management
- LRU cache implementation
- Circuit breaker pattern for API resilience
- Performance optimized components

## Installation

### Prerequisites
- Node.js 18+
- Expo CLI
- OpenWeatherMap API key (free at https://openweathermap.org/api)

### Setup
```bash
# Clone and install
git clone https://github.com/oluwadamilarey/weatherapp
cd weather-app
npm install

# Create environment file
echo "EXPO_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here" > .env

# Start the app
npx expo start

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator  
npx expo start --android

# Run on web
npx expo start --web

src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── services/      # API and cache services
├── types/         # TypeScript definitions
└── styles/        # Theme and styling

