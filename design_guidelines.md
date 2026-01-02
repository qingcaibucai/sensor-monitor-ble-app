# Design Guidelines: Bluetooth Sensor Monitor

## Architecture Decisions

### Authentication
**No Authentication Required**
- This is a single-user utility app focused on local sensor data monitoring
- Data is displayed in real-time and stored locally
- Include a **Settings/Profile screen** with:
  - User-customizable avatar (1 preset: simple circular icon with a sensor/wave symbol)
  - Display name field for device identification
  - App preferences: units (metric/imperial), data refresh rate, Bluetooth auto-connect settings

### Navigation Structure
**Tab Navigation** (3 tabs)
- **Tab 1: Dashboard** - Real-time sensor data display (Voltage, Current, Temperature, pH)
- **Tab 2: Charts** - Historical voltage and current visualizations
- **Tab 3: Settings** - Bluetooth connection, preferences, profile

Center tab placement: Dashboard, Charts, Settings (linear flow, no core action needed)

### Screen Specifications

#### 1. Dashboard Screen
- **Purpose**: Display real-time sensor readings and connection status
- **Layout**:
  - Header: Transparent with Bluetooth connection indicator (right button)
  - Main content: Scrollable view with 4 sensor data cards
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Connection status banner (connected/disconnected)
  - Four large data cards in 2x2 grid:
    - Voltage card (numeric value + unit)
    - Current card (numeric value + unit)
    - Temperature card with dynamic color indicator
    - pH card with dynamic color indicator
  - Each card shows: current value, label, timestamp of last update
  - Pull-to-refresh for manual data sync

#### 2. Charts Screen
- **Purpose**: Visualize voltage and current trends over time
- **Layout**:
  - Header: Transparent with time range selector (right button: 1h/6h/24h)
  - Main content: Scrollable view with two chart sections
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Voltage line chart (interactive, zoomable)
  - Current line chart (interactive, zoomable)
  - Time range controls
  - Export data button (floating action button, bottom-right with shadow)

#### 3. Settings Screen
- **Purpose**: Manage Bluetooth connection and app preferences
- **Layout**:
  - Header: Standard non-transparent with "Settings" title
  - Main content: Scrollable form
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Profile section: avatar, display name
  - Bluetooth section: paired devices list, scan button, auto-connect toggle
  - Data preferences: refresh interval, data retention period
  - Units: metric/imperial toggle
  - Clear data button (destructive action with confirmation)

#### 4. Bluetooth Connection Modal
- **Purpose**: Scan and connect to sensor devices
- **Layout**: Native modal (full screen)
- **Components**:
  - Header with "Close" and "Scan" buttons
  - Loading indicator during scan
  - List of available devices
  - Connection progress indicator

## Design System

### Color Palette
**Primary Colors**:
- Primary Blue: #007AFF (iOS standard, connection status, voltage)
- Background: #FFFFFF (light mode), #000000 (dark mode)
- Card Background: #F2F2F7 (light), #1C1C1E (dark)

**Semantic Colors**:
- Temperature Normal (< 37.5°C): #5AC8FA (light blue)
- Temperature High (≥ 37.5°C): #AF52DE (purple)
- pH Acidic (< 7): #34C759 (green)
- pH Alkaline (> 7): #8B4513 (brown)
- Disconnected: #FF3B30 (red)
- Connected: #34C759 (green)

**Neutral Colors**:
- Text Primary: #000000 (light), #FFFFFF (dark)
- Text Secondary: #8E8E93
- Border: #C6C6C8

### Typography
- **Large Title**: 34pt, Bold - Screen titles
- **Title 1**: 28pt, Bold - Card headers
- **Body**: 17pt, Regular - Data values, labels
- **Caption**: 12pt, Regular - Timestamps, units
- System font (SF Pro on iOS, Roboto on Android)

### Visual Design
- **Data Cards**:
  - Rounded corners: 12px
  - Padding: 16px
  - No shadow, subtle border (1px, neutral border color)
  - Large numeric value centered with unit below
  - Small label and timestamp at bottom
  - Dynamic background color for Temperature and pH cards based on thresholds

- **Charts**:
  - Clean grid lines with low opacity (#E5E5EA, 30%)
  - Line thickness: 2px
  - Smooth curves (not angular)
  - Interactive tooltips on touch
  - Axis labels in Caption typography

- **Connection Status**:
  - Floating banner at top of Dashboard when disconnected
  - Small icon indicator in header when connected
  - Pulsing animation during connection attempt

- **Floating Action Button** (Charts export):
  - Position: bottom-right, 16px from edges
  - Shadow: width: 0, height: 2, opacity: 0.10, radius: 2
  - Icon: download/share symbol
  - Size: 56x56px, circular

### Interaction Design
- All touchable cards have subtle scale feedback (0.98) on press
- Bluetooth scan shows loading spinner
- Real-time data updates with smooth number transitions (0.3s ease)
- Pull-to-refresh with standard iOS/Android spinner
- Connection status changes with subtle fade animation
- Chart panning and zooming with standard gestures

### Accessibility
- Minimum touch target: 44x44px
- VoiceOver labels for all data cards: "Voltage: [value] volts"
- Color-blind safe: temperature and pH use both color AND text labels
- Dynamic type support for all text elements
- High contrast mode support for borders and text

### Critical Assets
1. **Sensor Avatar Icon**: Simple circular icon with waveform/sensor symbol for profile (SVG, 120x120px)
2. **Bluetooth Icon**: Standard system icon (use Feather "bluetooth" icon)
3. **Chart Icons**: Standard system icons for time range and export (use Feather icons)

**NO custom illustrations or decorative graphics** - keep interface data-focused and minimal.