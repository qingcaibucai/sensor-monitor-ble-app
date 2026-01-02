import React from "react";
import { StyleSheet, ScrollView, View, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useSensor } from "@/contexts/SensorContext";
import { Spacing, SensorColors, BorderRadius } from "@/constants/theme";
import { LineChart } from "@/components/LineChart";
import { ThemedText } from "@/components/ThemedText";

export default function ChartsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const { voltageHistory, currentHistory, isConnected } = useSensor();

  const handleExport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["4xl"],
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {!isConnected ? (
          <View
            style={[
              styles.noDataCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <Feather name="radio" size={48} color={theme.textSecondary} />
            <ThemedText
              type="h4"
              style={[styles.noDataTitle, { color: theme.textSecondary }]}
            >
              No Sensor Connected
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary, textAlign: "center" }}>
              Connect to a sensor to view real-time charts
            </ThemedText>
          </View>
        ) : (
          <>
            <LineChart
              data={voltageHistory}
              title="Voltage"
              unit="V"
              color={SensorColors.voltage}
              height={220}
            />

            <View style={styles.chartSpacer} />

            <LineChart
              data={currentHistory}
              title="Current"
              unit="A"
              color={SensorColors.current}
              height={220}
            />
          </>
        )}
      </ScrollView>

      {isConnected && voltageHistory.length > 0 ? (
        <Pressable
          style={[styles.fab, { backgroundColor: theme.tabIconSelected }]}
          onPress={handleExport}
        >
          <Feather name="download" size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  chartSpacer: {
    height: Spacing.xl,
  },
  noDataCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["4xl"],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  noDataTitle: {
    marginTop: Spacing.md,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
});
