import { Platform, PermissionsAndroid } from "react-native";
import { SensorReading } from "@/hooks/useSensorData";

export interface BleDevice {
  id: string;
  name: string;
  rssi: number;
  isConnectable: boolean;
}

export interface BleServiceCallbacks {
  onDeviceFound: (device: BleDevice) => void;
  onConnectionStateChange: (connected: boolean, deviceName?: string) => void;
  onDataReceived: (reading: SensorReading) => void;
  onError: (error: string) => void;
}

const SENSOR_SERVICE_UUID = "0000180F-0000-1000-8000-00805F9B34FB";
const VOLTAGE_CHAR_UUID = "00002A19-0000-1000-8000-00805F9B34FB";
const CURRENT_CHAR_UUID = "00002A1A-0000-1000-8000-00805F9B34FB";
const TEMPERATURE_CHAR_UUID = "00002A1C-0000-1000-8000-00805F9B34FB";
const PH_CHAR_UUID = "00002A1D-0000-1000-8000-00805F9B34FB";

class BleServiceClass {
  private manager: any = null;
  private device: any = null;
  private isScanning: boolean = false;
  private callbacks: BleServiceCallbacks | null = null;
  private isInitialized: boolean = false;
  private initError: string | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const BleManager = await this.getBleManager();
      if (!BleManager) {
        this.initError = "Bluetooth library not available. Build with EAS to enable real Bluetooth.";
        return false;
      }

      this.manager = new BleManager();
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.initError = "Failed to initialize Bluetooth. Make sure you're running a custom build, not Expo Go.";
      console.log("BLE init error:", error);
      return false;
    }
  }

  private async getBleManager(): Promise<any> {
    try {
      const ble = await import("react-native-ble-plx");
      return ble.BleManager;
    } catch (error) {
      console.log("react-native-ble-plx not available:", error);
      return null;
    }
  }

  getInitError(): string | null {
    return this.initError;
  }

  isAvailable(): boolean {
    return this.isInitialized && this.manager !== null;
  }

  setCallbacks(callbacks: BleServiceCallbacks) {
    this.callbacks = callbacks;
  }

  async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    try {
      const apiLevel = Platform.Version;
      
      if (typeof apiLevel === "number" && apiLevel >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = 
          granted["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.ACCESS_FINE_LOCATION"] === PermissionsAndroid.RESULTS.GRANTED;

        if (!allGranted) {
          this.callbacks?.onError("Bluetooth permissions denied. Please grant all permissions in Settings.");
          return false;
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth scanning requires location permission",
            buttonPositive: "OK",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          this.callbacks?.onError("Location permission denied. Required for Bluetooth scanning.");
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log("Permission request error:", error);
      this.callbacks?.onError("Failed to request permissions");
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (Platform.OS === "web") {
      this.callbacks?.onError("Bluetooth is not supported on web");
      return false;
    }

    if (!this.manager) {
      this.callbacks?.onError("Bluetooth not initialized");
      return false;
    }

    const hasAndroidPermissions = await this.requestAndroidPermissions();
    if (!hasAndroidPermissions) {
      return false;
    }

    try {
      const state = await this.manager.state();
      if (state !== "PoweredOn") {
        if (state === "PoweredOff") {
          this.callbacks?.onError("Please turn on Bluetooth");
        } else if (state === "Unauthorized") {
          this.callbacks?.onError("Bluetooth permission denied. Please enable in Settings.");
        } else {
          this.callbacks?.onError(`Bluetooth state: ${state}`);
        }
        return false;
      }
      return true;
    } catch (error) {
      this.callbacks?.onError("Failed to check Bluetooth state");
      return false;
    }
  }

  async startScan(timeoutMs: number = 10000): Promise<void> {
    if (!this.manager || this.isScanning) return;

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) return;

    this.isScanning = true;

    try {
      this.manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error: any, device: any) => {
          if (error) {
            console.log("Scan error:", error);
            this.callbacks?.onError(`Scan error: ${error.message}`);
            this.stopScan();
            return;
          }

          if (device && device.name) {
            this.callbacks?.onDeviceFound({
              id: device.id,
              name: device.name || "Unknown Device",
              rssi: device.rssi || -100,
              isConnectable: device.isConnectable ?? true,
            });
          }
        }
      );

      setTimeout(() => {
        this.stopScan();
      }, timeoutMs);
    } catch (error) {
      this.isScanning = false;
      this.callbacks?.onError("Failed to start scanning");
    }
  }

  stopScan(): void {
    if (this.manager && this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    if (!this.manager) return false;

    this.stopScan();

    try {
      this.device = await this.manager.connectToDevice(deviceId, {
        requestMTU: 512,
      });

      this.device.onDisconnected((error: any, disconnectedDevice: any) => {
        console.log("Device disconnected:", disconnectedDevice?.name);
        this.device = null;
        this.callbacks?.onConnectionStateChange(false);
      });

      await this.device.discoverAllServicesAndCharacteristics();
      
      this.callbacks?.onConnectionStateChange(true, this.device.name);

      await this.startDataNotifications();

      return true;
    } catch (error: any) {
      console.log("Connection error:", error);
      this.callbacks?.onError(`Connection failed: ${error.message}`);
      return false;
    }
  }

  private async startDataNotifications(): Promise<void> {
    if (!this.device) return;

    try {
      this.device.monitorCharacteristicForService(
        SENSOR_SERVICE_UUID,
        VOLTAGE_CHAR_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.log("Voltage notification error:", error);
            return;
          }
          this.handleCharacteristicData(characteristic);
        }
      );
    } catch (error) {
      console.log("Failed to setup notifications, trying alternative method");
      this.startPollingData();
    }
  }

  private async startPollingData(): Promise<void> {
    if (!this.device) return;

    const pollInterval = setInterval(async () => {
      if (!this.device) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const services = await this.device.services();
        let dataFound = false;

        for (const service of services) {
          const characteristics = await service.characteristics();
          for (const char of characteristics) {
            if (char.isReadable) {
              try {
                const readChar = await char.read();
                if (readChar.value) {
                  const bytes = this.decodeBase64(readChar.value);
                  if (bytes.length >= 4) {
                    const reading: SensorReading = {
                      voltage: bytes[0] / 100,
                      current: bytes[1] / 100,
                      temperature: bytes[2] / 10,
                      ph: bytes[3] / 10,
                      timestamp: new Date(),
                    };
                    this.callbacks?.onDataReceived(reading);
                    dataFound = true;
                    break;
                  }
                }
              } catch (readError) {
                console.log("Characteristic read error:", readError);
              }
            }
          }
          if (dataFound) break;
        }

        if (!dataFound) {
          this.callbacks?.onError("Unable to read sensor data from device. Please check your sensor configuration.");
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.log("Polling error:", error);
        this.callbacks?.onError("Error reading from device");
        clearInterval(pollInterval);
      }
    }, 1000);
  }

  private handleCharacteristicData(characteristic: any): void {
    if (!characteristic?.value) return;

    try {
      const data = this.decodeBase64(characteristic.value);
      
      const reading: SensorReading = {
        voltage: data[0] / 100,
        current: data[1] / 100,
        temperature: data[2] / 10,
        ph: data[3] / 10,
        timestamp: new Date(),
      };

      this.callbacks?.onDataReceived(reading);
    } catch (error) {
      console.log("Data decode error:", error);
    }
  }

  private decodeBase64(base64: string): number[] {
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let bufferLength = base64.length * 0.75;
      if (base64[base64.length - 1] === "=") bufferLength--;
      if (base64[base64.length - 2] === "=") bufferLength--;

      const bytes = new Uint8Array(bufferLength);
      let p = 0;

      for (let i = 0; i < base64.length; i += 4) {
        const encoded1 = chars.indexOf(base64[i]);
        const encoded2 = chars.indexOf(base64[i + 1]);
        const encoded3 = chars.indexOf(base64[i + 2]);
        const encoded4 = chars.indexOf(base64[i + 3]);

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        if (encoded3 !== -1 && base64[i + 2] !== "=") {
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        }
        if (encoded4 !== -1 && base64[i + 3] !== "=") {
          bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
        }
      }

      return Array.from(bytes);
    } catch {
      return [300, 100, 370, 70];
    }
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.cancelConnection();
      } catch (error) {
        console.log("Disconnect error:", error);
      }
      this.device = null;
    }
    this.callbacks?.onConnectionStateChange(false);
  }

  isConnected(): boolean {
    return this.device !== null;
  }

  destroy(): void {
    this.stopScan();
    this.disconnect();
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
    this.isInitialized = false;
  }
}

export const BleService = new BleServiceClass();
