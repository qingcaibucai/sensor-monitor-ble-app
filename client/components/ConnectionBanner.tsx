import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { SensorColors, Spacing, BorderRadius } from "@/constants/theme";

interface ConnectionBannerProps {
  isConnected: boolean;
  onPress?: () => void;
}

export function ConnectionBanner({ isConnected, onPress }: ConnectionBannerProps) {
  const backgroundColor = isConnected
    ? SensorColors.connected
    : SensorColors.disconnected;

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.banner, { backgroundColor }]}>
        <Feather
          name={isConnected ? "bluetooth" : "wifi-off"}
          size={18}
          color="#FFFFFF"
        />
        <ThemedText style={styles.text}>
          {isConnected ? "Sensor Connected" : "Sensor Disconnected - Tap to connect"}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
