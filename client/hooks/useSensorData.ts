import { useState, useEffect, useCallback, useRef } from "react";

export type ConnectionMode = "simulated" | "real";

export interface SensorReading {
  voltage: number;
  current: number;
  temperature: number;
  ph: number;
  timestamp: Date;
}

export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

export interface SensorState {
  isConnected: boolean;
  currentReading: SensorReading | null;
  voltageHistory: ChartDataPoint[];
  currentHistory: ChartDataPoint[];
  isSimulating: boolean;
  connectionMode: ConnectionMode;
  connectedDeviceName: string | null;
}

const MAX_HISTORY_POINTS = 60;

function generateRandomReading(): SensorReading {
  return {
    voltage: 3.0 + Math.random() * 2.0,
    current: 0.5 + Math.random() * 1.5,
    temperature: 35.0 + Math.random() * 5.0,
    ph: 5.0 + Math.random() * 4.0,
    timestamp: new Date(),
  };
}

export function useSensorData() {
  const [state, setState] = useState<SensorState>({
    isConnected: false,
    currentReading: null,
    voltageHistory: [],
    currentHistory: [],
    isSimulating: false,
    connectionMode: "simulated",
    connectedDeviceName: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setConnectionMode = useCallback((mode: ConnectionMode) => {
    setState((prev) => ({
      ...prev,
      connectionMode: mode,
      isConnected: false,
      isSimulating: false,
      connectedDeviceName: null,
    }));
  }, []);

  const startSimulation = useCallback((deviceName?: string) => {
    setState((prev) => ({
      ...prev,
      isConnected: true,
      isSimulating: true,
      connectedDeviceName: deviceName || "Simulated Device",
    }));
  }, []);

  const stopSimulation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isSimulating: false,
      connectedDeviceName: null,
    }));
  }, []);

  const connectToRealDevice = useCallback((deviceName: string) => {
    setState((prev) => ({
      ...prev,
      isConnected: true,
      isSimulating: false,
      connectedDeviceName: deviceName,
    }));
  }, []);

  const disconnectRealDevice = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectedDeviceName: null,
    }));
  }, []);

  const updateRealReading = useCallback((reading: SensorReading) => {
    const timestamp = reading.timestamp.getTime();
    setState((prev) => {
      const newVoltageHistory = [
        ...prev.voltageHistory,
        { timestamp, value: reading.voltage },
      ].slice(-MAX_HISTORY_POINTS);

      const newCurrentHistory = [
        ...prev.currentHistory,
        { timestamp, value: reading.current },
      ].slice(-MAX_HISTORY_POINTS);

      return {
        ...prev,
        currentReading: reading,
        voltageHistory: newVoltageHistory,
        currentHistory: newCurrentHistory,
      };
    });
  }, []);

  const toggleConnection = useCallback(() => {
    setState((prev) => {
      if (prev.isConnected) {
        return {
          ...prev,
          isConnected: false,
          isSimulating: false,
          connectedDeviceName: null,
        };
      } else {
        return {
          ...prev,
          isConnected: true,
          isSimulating: prev.connectionMode === "simulated",
          connectedDeviceName: prev.connectionMode === "simulated" ? "Simulated Device" : null,
        };
      }
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      voltageHistory: [],
      currentHistory: [],
      currentReading: null,
    }));
  }, []);

  useEffect(() => {
    if (state.isSimulating) {
      intervalRef.current = setInterval(() => {
        const reading = generateRandomReading();
        const timestamp = reading.timestamp.getTime();

        setState((prev) => {
          const newVoltageHistory = [
            ...prev.voltageHistory,
            { timestamp, value: reading.voltage },
          ].slice(-MAX_HISTORY_POINTS);

          const newCurrentHistory = [
            ...prev.currentHistory,
            { timestamp, value: reading.current },
          ].slice(-MAX_HISTORY_POINTS);

          return {
            ...prev,
            currentReading: reading,
            voltageHistory: newVoltageHistory,
            currentHistory: newCurrentHistory,
          };
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [state.isSimulating]);

  return {
    ...state,
    startSimulation,
    stopSimulation,
    toggleConnection,
    clearHistory,
    setConnectionMode,
    connectToRealDevice,
    disconnectRealDevice,
    updateRealReading,
  };
}
