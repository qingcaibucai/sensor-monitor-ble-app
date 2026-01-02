import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useSensor } from "@/contexts/SensorContext";
import { Spacing, BorderRadius, SensorColors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { BleService, BleDevice } from "@/services/BleService";

interface DeviceItem {
  id: string;
  name: string;
  rssi: number;
  type: "simulated" | "real";
}

const SIMULATED_DEVICES: DeviceItem[] = [
  { id: "sim-1", name: "Simulated Sensor A", rssi: -35, type: "simulated" },
  { id: "sim-2", name: "Simulated Sensor B", rssi: -42, type: "simulated" },
  { id: "sim-3", name: "Demo Lab Monitor", rssi: -55, type: "simulated" },
];

export default function BluetoothScanScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    isConnected,
    connectionMode,
    connectedDeviceName,
    startSimulation,
    stopSimulation,
    connectToRealDevice,
    disconnectRealDevice,
    updateRealReading,
  } = useSensor();

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);
  const [bleAvailable, setBleAvailable] = useState<boolean | null>(null);

  const initializeBle = useCallback(async () => {
    if (connectionMode === "real") {
      const initialized = await BleService.initialize();
      setBleAvailable(initialized);
      if (!initialized) {
        setBleError(BleService.getInitError() || "Bluetooth not available");
      }
    }
  }, [connectionMode]);

  useEffect(() => {
    initializeBle();

    BleService.setCallbacks({
      onDeviceFound: (device: BleDevice) => {
        setDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id);
          if (exists) {
            return prev.map((d) =>
              d.id === device.id ? { ...d, rssi: device.rssi } : d
            );
          }
          return [
            ...prev,
            {
              id: device.id,
              name: device.name,
              rssi: device.rssi,
              type: "real" as const,
            },
          ];
        });
      },
      onConnectionStateChange: (connected, deviceName) => {
        if (connected && deviceName) {
          connectToRealDevice(deviceName);
        } else {
          disconnectRealDevice();
        }
      },
      onDataReceived: (reading) => {
        updateRealReading(reading);
      },
      onError: (error) => {
        setBleError(error);
        setIsScanning(false);
      },
    });

    return () => {
      BleService.stopScan();
    };
  }, [connectionMode, connectToRealDevice, disconnectRealDevice, updateRealReading, initializeBle]);

  const startScan = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsScanning(true);
    setDevices([]);
    setBleError(null);

    if (connectionMode === "simulated") {
      setTimeout(() => {
        setDevices(SIMULATED_DEVICES);
        setIsScanning(false);
      }, 1500);
    } else {
      if (Platform.OS === "web") {
        setBleError("Bluetooth is not available on web. Please use a custom build on your mobile device.");
        setIsScanning(false);
        return;
      }

      if (bleAvailable === null) {
        const initialized = await BleService.initialize();
        setBleAvailable(initialized);
        if (!initialized) {
          setBleError(BleService.getInitError() || "Real Bluetooth requires a custom build with react-native-ble-plx. Please build the app using 'eas build' to enable this feature.");
          setIsScanning(false);
          return;
        }
      } else if (bleAvailable === false) {
        setBleError("Real Bluetooth requires a custom build with react-native-ble-plx. Please build the app using 'eas build' to enable this feature.");
        setIsScanning(false);
        return;
      }

      await BleService.startScan(10000);
      setTimeout(() => {
        setIsScanning(false);
      }, 10000);
    }
  };

  useEffect(() => {
    startScan();
  }, [connectionMode]);

  const handleDevicePress = async (device: DeviceItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnectingId(device.id);

    if (device.type === "simulated") {
      setTimeout(async () => {
        startSimulation(device.name);
        setConnectingId(null);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      }, 1500);
    } else {
      const success = await BleService.connectToDevice(device.id);
      setConnectingId(null);
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleDisconnect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (connectionMode === "simulated") {
      stopSimulation();
    } else {
      await BleService.disconnect();
    }
  };

  const getSignalStrength = (rssi: number) => {
    if (rssi > -50) return "Excellent";
    if (rssi > -65) return "Good";
    if (rssi > -75) return "Fair";
    return "Weak";
  };

  const renderDevice = ({ item }: { item: DeviceItem }) => {
    const isConnecting = connectingId === item.id;

    return (
      <Pressable
        onPress={() => handleDevicePress(item)}
        disabled={isConnecting || isConnected}
        style={({ pressed }) => [
          styles.deviceRow,
          {
            backgroundColor: pressed
              ? theme.backgroundSecondary
              : theme.cardBackground,
            opacity: isConnected && !isConnecting ? 0.5 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.deviceIcon,
            {
              backgroundColor:
                item.type === "simulated"
                  ? SensorColors.voltage
                  : theme.tabIconSelected,
            },
          ]}
        >
          <Feather
            name={item.type === "simulated" ? "activity" : "cpu"}
            size={20}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.deviceInfo}>
          <ThemedText style={styles.deviceName}>{item.name}</ThemedText>
          <View style={styles.deviceMeta}>
            <ThemedText style={[styles.deviceSignal, { color: theme.textSecondary }]}>
              Signal: {getSignalStrength(item.rssi)}
            </ThemedText>
            <View
              style={[
                styles.deviceTypeBadge,
                {
                  backgroundColor:
                    item.type === "simulated"
                      ? SensorColors.voltage + "20"
                      : theme.tabIconSelected + "20",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.deviceTypeText,
                  {
                    color:
                      item.type === "simulated"
                        ? SensorColors.voltage
                        : theme.tabIconSelected,
                  },
                ]}
              >
                {item.type === "simulated" ? "Simulated" : "Real BLE"}
              </ThemedText>
            </View>
          </View>
        </View>
        {isConnecting ? (
          <ActivityIndicator color={theme.tabIconSelected} />
        ) : (
          <Feather
            name="chevron-right"
            size={20}
            color={theme.textSecondary}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.modeIndicator,
          {
            backgroundColor:
              connectionMode === "simulated"
                ? SensorColors.voltage + "15"
                : theme.tabIconSelected + "15",
            borderColor:
              connectionMode === "simulated"
                ? SensorColors.voltage + "30"
                : theme.tabIconSelected + "30",
          },
        ]}
      >
        <Feather
          name={connectionMode === "simulated" ? "activity" : "bluetooth"}
          size={16}
          color={
            connectionMode === "simulated"
              ? SensorColors.voltage
              : theme.tabIconSelected
          }
        />
        <ThemedText
          style={[
            styles.modeIndicatorText,
            {
              color:
                connectionMode === "simulated"
                  ? SensorColors.voltage
                  : theme.tabIconSelected,
            },
          ]}
        >
          {connectionMode === "simulated"
            ? "Simulated Mode - Test data will be generated"
            : bleAvailable
            ? "Real Bluetooth Mode - Scanning for BLE devices"
            : "Real Bluetooth Mode - Requires custom build"}
        </ThemedText>
      </View>

      {isConnected ? (
        <View style={styles.connectedSection}>
          <View
            style={[
              styles.connectedCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.connectedHeader}>
              <View
                style={[
                  styles.deviceIcon,
                  { backgroundColor: SensorColors.connected },
                ]}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.deviceInfo}>
                <ThemedText style={styles.deviceName}>
                  {connectedDeviceName || "Connected Device"}
                </ThemedText>
                <ThemedText
                  style={[styles.deviceSignal, { color: SensorColors.connected }]}
                >
                  Connected - {connectionMode === "simulated" ? "Simulated Data" : "Real Data"}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={handleDisconnect}
              style={[
                styles.disconnectButton,
                { backgroundColor: SensorColors.disconnected },
              ]}
            >
              <ThemedText style={styles.disconnectText}>Disconnect</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <ThemedText style={[styles.headerText, { color: theme.textSecondary }]}>
              {isScanning
                ? "Scanning for nearby devices..."
                : bleError
                ? "Scan complete"
                : `${devices.length} device${devices.length !== 1 ? "s" : ""} found`}
            </ThemedText>
            <Pressable
              onPress={startScan}
              disabled={isScanning}
              style={[
                styles.scanButton,
                { backgroundColor: theme.tabIconSelected },
              ]}
            >
              {isScanning ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather name="refresh-cw" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          {bleError ? (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
              ]}
            >
              <Feather name="alert-circle" size={24} color={SensorColors.temperature} />
              <ThemedText style={[styles.errorText, { color: theme.text }]}>
                {bleError}
              </ThemedText>
              {connectionMode === "real" ? (
                <View style={styles.errorHintContainer}>
                  <ThemedText style={[styles.errorHint, { color: theme.textSecondary }]}>
                    To enable real Bluetooth:
                  </ThemedText>
                  <ThemedText style={[styles.errorStep, { color: theme.textSecondary }]}>
                    1. Download the project code
                  </ThemedText>
                  <ThemedText style={[styles.errorStep, { color: theme.textSecondary }]}>
                    2. Run: npm install && npx expo install react-native-ble-plx
                  </ThemedText>
                  <ThemedText style={[styles.errorStep, { color: theme.textSecondary }]}>
                    3. Build with: eas build --platform android --profile preview
                  </ThemedText>
                  <ThemedText style={[styles.errorStep, { color: theme.textSecondary }]}>
                    Or switch to "Simulated" mode in Settings to test with demo data.
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={renderDevice}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              paddingBottom: insets.bottom + Spacing.xl,
            }}
            ItemSeparatorComponent={() => (
              <View
                style={[styles.separator, { backgroundColor: theme.border }]}
              />
            )}
            ListEmptyComponent={
              !isScanning && !bleError ? (
                <View style={styles.emptyState}>
                  <Feather
                    name="radio"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    No devices found
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.emptySubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Make sure your sensor is powered on and in range
                  </ThemedText>
                </View>
              ) : null
            }
          />
        </>
      )}

      {Platform.OS === "web" && connectionMode === "real" ? (
        <View
          style={[
            styles.webNotice,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.webNoticeText, { color: theme.textSecondary }]}>
            Real Bluetooth requires running on a physical device with a custom build
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  modeIndicatorText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerText: {
    fontSize: 14,
  },
  scanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    gap: Spacing.md,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
  },
  deviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  deviceSignal: {
    fontSize: 13,
  },
  deviceTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deviceTypeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  connectedSection: {
    padding: Spacing.lg,
  },
  connectedCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.lg,
  },
  connectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  disconnectButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  disconnectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  errorHintContainer: {
    marginTop: Spacing.sm,
    alignItems: "flex-start",
    width: "100%",
  },
  errorHint: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  errorStep: {
    fontSize: 12,
    marginLeft: Spacing.sm,
    marginTop: 2,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  webNoticeText: {
    fontSize: 13,
    flex: 1,
  },
});
