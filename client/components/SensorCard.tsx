import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, SensorColors, Typography } from "@/constants/theme";

interface SensorCardProps {
  label: string;
  value: number | null;
  unit: string;
  icon: keyof typeof Feather.glyphMap;
  timestamp?: Date | null;
  colorType?: "voltage" | "current" | "temperature" | "ph";
  onPress?: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getValueColor(colorType: string | undefined, value: number | null): string | null {
  if (value === null) return null;
  
  switch (colorType) {
    case "temperature":
      return value >= 37.5 ? SensorColors.temperatureHigh : SensorColors.temperatureNormal;
    case "ph":
      return value < 7 ? SensorColors.phAcidic : SensorColors.phAlkaline;
    case "voltage":
      return SensorColors.voltage;
    case "current":
      return SensorColors.current;
    default:
      return null;
  }
}

function getStatusLabel(colorType: string | undefined, value: number | null): string | null {
  if (value === null) return null;
  
  switch (colorType) {
    case "temperature":
      return value >= 37.5 ? "High" : "Normal";
    case "ph":
      return value < 7 ? "Acidic" : "Alkaline";
    default:
      return null;
  }
}

export function SensorCard({
  label,
  value,
  unit,
  icon,
  timestamp,
  colorType,
  onPress,
}: SensorCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  
  const valueColor = getValueColor(colorType, value);
  const statusLabel = getStatusLabel(colorType, value);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const formatTimestamp = (date: Date | null | undefined) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <Feather
          name={icon}
          size={24}
          color={valueColor || theme.text}
        />
        {statusLabel ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: valueColor || theme.backgroundSecondary },
            ]}
          >
            <ThemedText
              style={[styles.statusText, { color: "#FFFFFF" }]}
            >
              {statusLabel}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.valueContainer}>
        <ThemedText
          style={[
            styles.value,
            valueColor ? { color: valueColor } : null,
          ]}
        >
          {value !== null ? value.toFixed(2) : "--"}
        </ThemedText>
        <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
          {unit}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
          {formatTimestamp(timestamp)}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 140,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: 32,
    fontWeight: "700",
  },
  unit: {
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
  footer: {
    marginTop: "auto",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
  },
});
