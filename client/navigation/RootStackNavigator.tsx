import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import BluetoothScanScreen from "@/screens/BluetoothScanScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { SensorProvider } from "@/contexts/SensorContext";

export type RootStackParamList = {
  Main: undefined;
  BluetoothScan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <SensorProvider>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BluetoothScan"
          component={BluetoothScanScreen}
          options={{
            presentation: "modal",
            headerTitle: "Bluetooth Devices",
          }}
        />
      </Stack.Navigator>
    </SensorProvider>
  );
}
