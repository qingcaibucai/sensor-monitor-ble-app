# Sensor Monitor - Bluetooth Sensor Monitoring App

## Overview

This is a React Native/Expo mobile application for monitoring sensor data via Bluetooth. The app displays real-time readings for voltage, current, temperature, and pH levels from connected sensor devices. It features a dashboard with live sensor cards, historical data visualization through charts, and settings for managing Bluetooth connections and user preferences.

The application follows a single-user utility model with no authentication required - it's designed for local sensor data monitoring with data stored locally.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with bottom tabs (Dashboard, Charts, Settings) and native stack navigator for modals
- **State Management**: React Context (SensorContext) for sensor data, TanStack React Query for server state
- **UI Components**: Custom themed components (ThemedText, ThemedView, Card, Button) with dark/light mode support
- **Animations**: React Native Reanimated for smooth interactions
- **Charts**: Custom SVG-based LineChart component using react-native-svg

### Project Structure
- `/client` - React Native frontend code
  - `/components` - Reusable UI components
  - `/screens` - Screen components (Dashboard, Charts, Settings, BluetoothScan)
  - `/navigation` - Navigation configuration
  - `/hooks` - Custom React hooks (useTheme, useSensorData, useScreenOptions)
  - `/contexts` - React Context providers
  - `/services` - BLE service abstraction
  - `/constants` - Theme, colors, spacing definitions
- `/server` - Express.js backend
- `/shared` - Shared code between client and server (Drizzle schema)
- `/assets` - Images and static assets

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Purpose**: Serves landing page and provides API endpoints
- **Storage**: In-memory storage with interface ready for database integration

### Data Flow
1. Sensor data comes from Bluetooth devices or simulation
2. `useSensorData` hook manages connection state and data history
3. `SensorContext` provides data to all screens
4. Charts display historical voltage/current readings (max 60 data points)

### Bluetooth Integration
- **Service**: `BleService` class abstracts Bluetooth Low Energy operations
- **Modes**: Supports both simulated devices (for testing) and real BLE connections
- **Permissions**: Configured for both iOS and Android Bluetooth permissions in app.json

## External Dependencies

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Located in `/shared/schema.ts` with users table defined
- **Current State**: Schema defined but app currently uses in-memory storage

### Third-Party Services
- **Expo Services**: Splash screen, haptics, blur effects, status bar
- **Bluetooth**: react-native-ble-plx (loaded dynamically for EAS builds)

### Key NPM Packages
- `expo` ^54.0.23 - Core Expo framework
- `react-native` 0.81.5 - React Native runtime
- `@react-navigation/*` v7 - Navigation system
- `react-native-reanimated` ~4.1.1 - Animations
- `react-native-svg` 15.12.1 - SVG rendering for charts
- `drizzle-orm` ^0.39.3 - Database ORM
- `@tanstack/react-query` ^5.90.7 - Data fetching/caching
- `express` ^4.21.2 - Backend server

### Build & Development
- Development uses Expo's Metro bundler with custom proxy configuration for Replit
- Production builds use EAS Build for native Bluetooth functionality
- TypeScript with path aliases (`@/` for client, `@shared/` for shared)