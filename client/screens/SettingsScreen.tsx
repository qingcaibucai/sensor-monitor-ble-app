import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Switch, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useSensor } from "@/contexts/SensorContext";
import { Spacing, BorderRadius, SensorColors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  destructive,
}: SettingsRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { backgroundColor: pressed ? theme.backgroundSecondary : theme.cardBackground },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: destructive
              ? SensorColors.disconnected
              : theme.tabIconSelected,
          },
        ]}
      >
        <Feather name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.rowContent}>
        <ThemedText
          style={[
            styles.rowTitle,
            destructive ? { color: SensorColors.disconnected } : null,
          ]}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {value}
      {onPress && !value ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

interface ModeButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function ModeButton({ label, active, onPress }: ModeButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeButton,
        {
          backgroundColor: active ? theme.tabIconSelected : theme.backgroundSecondary,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.modeButtonText,
          { color: active ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const { isConnected, clearHistory, connectionMode, setConnectionMode } = useSensor();
  const [autoConnect, setAutoConnect] = useState(true);
  const [metricUnits, setMetricUnits] = useState(true);

  const handleBluetoothPress = () => {
    navigation.navigate("BluetoothScan");
  };

  const handleClearData = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Clear All Data",
      "This will remove all sensor history data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearHistory();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleModeChange = async (mode: "simulated" | "real") => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConnectionMode(mode);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        CONNECTION MODE
      </ThemedText>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <View style={styles.modeSelector}>
          <View style={styles.modeInfo}>
            <Feather
              name={connectionMode === "simulated" ? "activity" : "bluetooth"}
              size={20}
              color={theme.tabIconSelected}
            />
            <View style={styles.modeTextContainer}>
              <ThemedText style={styles.rowTitle}>
                {connectionMode === "simulated" ? "Simulated Signal" : "Real Bluetooth"}
              </ThemedText>
              <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                {connectionMode === "simulated"
                  ? "Use generated test data"
                  : "Connect to real BLE sensors"}
              </ThemedText>
            </View>
          </View>
          <View style={styles.modeButtons}>
            <ModeButton
              label="Simulated"
              active={connectionMode === "simulated"}
              onPress={() => handleModeChange("simulated")}
            />
            <ModeButton
              label="Real BLE"
              active={connectionMode === "real"}
              onPress={() => handleModeChange("real")}
            />
          </View>
        </View>
      </View>

      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        BLUETOOTH
      </ThemedText>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <SettingsRow
          icon="bluetooth"
          title="Bluetooth Devices"
          subtitle={isConnected ? "Connected" : "Not connected"}
          onPress={handleBluetoothPress}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="link"
          title="Auto-Connect"
          subtitle="Automatically connect to known devices"
          value={
            <Switch
              value={autoConnect}
              onValueChange={setAutoConnect}
              trackColor={{
                false: theme.backgroundSecondary,
                true: SensorColors.connected,
              }}
            />
          }
        />
      </View>

      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        PREFERENCES
      </ThemedText>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <SettingsRow
          icon="thermometer"
          title="Metric Units"
          subtitle="Use Celsius for temperature"
          value={
            <Switch
              value={metricUnits}
              onValueChange={setMetricUnits}
              trackColor={{
                false: theme.backgroundSecondary,
                true: SensorColors.connected,
              }}
            />
          }
        />
      </View>

      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        DATA
      </ThemedText>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <SettingsRow
          icon="trash-2"
          title="Clear History"
          subtitle="Remove all sensor data"
          onPress={handleClearData}
          destructive
        />
      </View>

      <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
        ABOUT
      </ThemedText>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <SettingsRow icon="info" title="Version" value={<ThemedText style={{ color: theme.textSecondary }}>1.0.0</ThemedText>} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
    marginLeft: Spacing.sm,
  },
  section: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
  modeSelector: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  modeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
