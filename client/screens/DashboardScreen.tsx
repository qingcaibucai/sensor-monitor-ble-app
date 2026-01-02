import React from "react";
import { StyleSheet, View, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useSensor } from "@/contexts/SensorContext";
import { Spacing } from "@/constants/theme";
import { SensorCard } from "@/components/SensorCard";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const {
    isConnected,
    currentReading,
    toggleConnection,
  } = useSensor();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleConnectionPress = () => {
    navigation.navigate("BluetoothScan");
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ConnectionBanner
        isConnected={isConnected}
        onPress={handleConnectionPress}
      />

      <View style={styles.cardsGrid}>
        <View style={styles.cardRow}>
          <SensorCard
            label="Voltage"
            value={currentReading?.voltage ?? null}
            unit="V"
            icon="zap"
            timestamp={currentReading?.timestamp}
            colorType="voltage"
          />
          <SensorCard
            label="Current"
            value={currentReading?.current ?? null}
            unit="A"
            icon="battery-charging"
            timestamp={currentReading?.timestamp}
            colorType="current"
          />
        </View>
        <View style={styles.cardRow}>
          <SensorCard
            label="Temperature"
            value={currentReading?.temperature ?? null}
            unit="C"
            icon="thermometer"
            timestamp={currentReading?.timestamp}
            colorType="temperature"
          />
          <SensorCard
            label="pH Level"
            value={currentReading?.ph ?? null}
            unit="pH"
            icon="droplet"
            timestamp={currentReading?.timestamp}
            colorType="ph"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardsGrid: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
