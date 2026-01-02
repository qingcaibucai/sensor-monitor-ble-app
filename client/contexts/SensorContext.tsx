import React, { createContext, useContext, ReactNode } from "react";
import { useSensorData, SensorState, ChartDataPoint, SensorReading, ConnectionMode } from "@/hooks/useSensorData";

interface SensorContextType extends SensorState {
  startSimulation: (deviceName?: string) => void;
  stopSimulation: () => void;
  toggleConnection: () => void;
  clearHistory: () => void;
  setConnectionMode: (mode: ConnectionMode) => void;
  connectToRealDevice: (deviceName: string) => void;
  disconnectRealDevice: () => void;
  updateRealReading: (reading: SensorReading) => void;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export function SensorProvider({ children }: { children: ReactNode }) {
  const sensorData = useSensorData();

  return (
    <SensorContext.Provider value={sensorData}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensor() {
  const context = useContext(SensorContext);
  if (context === undefined) {
    throw new Error("useSensor must be used within a SensorProvider");
  }
  return context;
}
