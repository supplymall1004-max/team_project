/**
 * @file bluetooth-client.ts
 * @description Web Bluetooth API를 사용한 건강 기기 연결 클라이언트
 *
 * 환경 변수 없이 브라우저에서 직접 블루투스 기기와 연결하여 건강 데이터를 가져옵니다.
 */

// Web Bluetooth API 타입 정의 (브라우저 전용)
declare global {
  interface BluetoothRemoteGATTServer {
    connected: boolean;
    device: BluetoothDevice;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    isPrimary: boolean;
    uuid: string;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    uuid: string;
    properties: BluetoothCharacteristicProperties;
    getValue(): Promise<DataView>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
    removeEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
  }

  interface BluetoothCharacteristicProperties {
    broadcast: boolean;
    read: boolean;
    writeWithoutResponse: boolean;
    write: boolean;
    notify: boolean;
    indicate: boolean;
    authenticatedSignedWrites: boolean;
    reliableWrite: boolean;
    writableAuxiliaries: boolean;
  }

  interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    watchAdvertisements(): Promise<void>;
    unwatchAdvertisements(): void;
    addEventListener(type: 'advertisementreceived' | 'gattserverdisconnected', listener: (event: Event) => void, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: 'advertisementreceived' | 'gattserverdisconnected', listener: (event: Event) => void, options?: boolean | EventListenerOptions): void;
  }

  interface Bluetooth extends EventTarget {
    getAvailability(): Promise<boolean>;
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    getDevices(): Promise<BluetoothDevice[]>;
  }

  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
  }

  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    manufacturerData?: BluetoothManufacturerDataFilter[];
    serviceData?: BluetoothServiceDataFilter[];
  }

  interface BluetoothManufacturerDataFilter {
    companyIdentifier: number;
    dataPrefix?: BufferSource;
    mask?: BufferSource;
  }

  interface BluetoothServiceDataFilter {
    service: BluetoothServiceUUID;
    dataPrefix?: BufferSource;
    mask?: BufferSource;
  }

  type BluetoothServiceUUID = number | string;
  type BluetoothCharacteristicUUID = number | string;

  interface Navigator {
    bluetooth?: Bluetooth;
  }
}

/**
 * 블루투스 기기 정보 (커스텀 인터페이스)
 */
export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  device: BluetoothDevice;
}

/**
 * 건강 데이터 타입
 */
export interface HealthData {
  type: 'heart_rate' | 'steps' | 'calories' | 'weight' | 'blood_pressure' | 'glucose' | 'temperature';
  value: number;
  timestamp: string;
}

/**
 * 혈압 데이터
 */
export interface BloodPressureData {
  systolic: number; // 수축기 혈압 (mmHg)
  diastolic: number; // 이완기 혈압 (mmHg)
  pulse?: number; // 맥박 (bpm)
  timestamp: string;
}

/**
 * 혈당 데이터
 */
export interface GlucoseData {
  glucose: number; // 혈당 (mg/dL)
  timestamp: string;
  context?: 'before_meal' | 'after_meal' | 'fasting' | 'casual';
}

/**
 * 체중 데이터
 */
export interface WeightData {
  weight: number; // 체중 (kg)
  bodyFat?: number; // 체지방률 (%)
  muscleMass?: number; // 근육량 (kg)
  timestamp: string;
}

/**
 * 체온 데이터
 */
export interface TemperatureData {
  temperature: number; // 체온 (°C)
  timestamp: string;
  type?: 'body' | 'surface';
}

/**
 * Web Bluetooth API를 사용한 건강 기기 클라이언트
 */
export class BluetoothHealthClient {
  private device: BluetoothDeviceInfo | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  /**
   * 블루투스 기기 스캔 및 연결
   */
  async connect(): Promise<BluetoothDeviceInfo> {
    try {
      console.group('[BluetoothHealthClient] 블루투스 기기 연결 시작');

      // Web Bluetooth API 지원 확인
      if (!navigator.bluetooth) {
        throw new Error('이 브라우저는 Web Bluetooth API를 지원하지 않습니다. Chrome, Edge, Samsung Internet을 사용해주세요.');
      }

      // 블루투스 기기 선택
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          // Heart Rate Service
          { services: ['heart_rate'] },
          // Health Thermometer Service
          { services: ['health_thermometer'] },
          // Generic Access Profile (대부분의 건강 기기)
          { services: [0x1800] },
          // 이름으로 필터링 (선택사항)
          { namePrefix: 'Mi Band' },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
          { namePrefix: 'Polar' },
        ],
        optionalServices: [
          'battery_service',
          'device_information',
          'heart_rate',
          'health_thermometer',
        ],
      });

      console.log('✅ 기기 선택됨:', device.name);

      // GATT 서버 연결
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('GATT 서버 연결 실패');
      }

      const deviceInfo: BluetoothDeviceInfo = {
        id: device.id,
        name: device.name || '알 수 없는 기기',
        device: device,
      };

      this.device = deviceInfo;
      this.server = server;

      // 연결 해제 이벤트 리스너
      // Web Bluetooth API의 gattserverdisconnected 이벤트는 실제로 지원되지만 TypeScript 타입 정의에 없을 수 있음
      (device as any).addEventListener('gattserverdisconnected', () => {
        console.log('⚠️ 기기 연결 해제됨');
        this.device = null;
        this.server = null;
      });

      console.log('✅ 블루투스 기기 연결 완료');
      console.groupEnd();

      return deviceInfo;
    } catch (error) {
      console.error('❌ 블루투스 기기 연결 실패:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 심박수 데이터 읽기
   */
  async readHeartRate(): Promise<number | null> {
    try {
      if (!this.server) {
        throw new Error('기기가 연결되지 않았습니다');
      }

      console.group('[BluetoothHealthClient] 심박수 읽기');

      // Heart Rate Service 연결
      const service = await this.server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      // 알림 활성화
      await characteristic.startNotifications();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          characteristic.stopNotifications();
          reject(new Error('심박수 읽기 타임아웃'));
        }, 10000); // 10초 타임아웃

        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          const heartRate = value.getUint16(1, true); // Little-endian
          
          clearTimeout(timeout);
          characteristic.stopNotifications();
          
          console.log('✅ 심박수:', heartRate, 'bpm');
          console.groupEnd();
          
          resolve(heartRate);
        });
      });
    } catch (error) {
      console.error('❌ 심박수 읽기 실패:', error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * 배터리 잔량 읽기
   */
  async readBatteryLevel(): Promise<number | null> {
    try {
      if (!this.server) {
        throw new Error('기기가 연결되지 않았습니다');
      }

      const service = await this.server.getPrimaryService('battery_service');
      const characteristic = await service.getCharacteristic('battery_level');
      const value = await characteristic.readValue();
      const batteryLevel = value.getUint8(0);

      console.log('✅ 배터리 잔량:', batteryLevel, '%');
      return batteryLevel;
    } catch (error) {
      console.warn('⚠️ 배터리 잔량 읽기 실패:', error);
      return null;
    }
  }

  /**
   * 기기 정보 읽기
   */
  async readDeviceInfo(): Promise<{ manufacturer?: string; model?: string } | null> {
    try {
      if (!this.server) {
        throw new Error('기기가 연결되지 않았습니다');
      }

      const service = await this.server.getPrimaryService('device_information');
      
      const manufacturer = await service
        .getCharacteristic('manufacturer_name_string')
        .then(c => c.readValue())
        .then(v => new TextDecoder().decode(v))
        .catch(() => undefined);

      const model = await service
        .getCharacteristic('model_number_string')
        .then(c => c.readValue())
        .then(v => new TextDecoder().decode(v))
        .catch(() => undefined);

      return { manufacturer, model };
    } catch (error) {
      console.warn('⚠️ 기기 정보 읽기 실패:', error);
      return null;
    }
  }

  /**
   * 연결 해제
   */
  disconnect(): void {
    if (this.device && this.device.device.gatt) {
      this.device.device.gatt.disconnect();
      this.device = null;
      this.server = null;
      console.log('✅ 블루투스 기기 연결 해제');
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.device !== null && this.server !== null;
  }

  /**
   * 기기 이름 가져오기
   */
  getDeviceName(): string | null {
    return this.device?.name || null;
  }

  /**
   * 특정 서비스로 기기 연결 (타입별 필터링)
   */
  async connectWithService(serviceName: string | number): Promise<BluetoothDeviceInfo> {
    try {
      console.group(`[BluetoothHealthClient] ${serviceName} 서비스로 기기 연결`);

      if (!navigator.bluetooth) {
        throw new Error('이 브라우저는 Web Bluetooth API를 지원하지 않습니다.');
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [serviceName] },
        ],
        optionalServices: [
          'battery_service',
          'device_information',
          serviceName as string,
        ],
      });

      console.log('✅ 기기 선택됨:', device.name);

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('GATT 서버 연결 실패');
      }

      const deviceInfo: BluetoothDeviceInfo = {
        id: device.id,
        name: device.name || '알 수 없는 기기',
        device: device,
      };

      this.device = deviceInfo;
      this.server = server;

      // Web Bluetooth API의 gattserverdisconnected 이벤트는 실제로 지원되지만 TypeScript 타입 정의에 없을 수 있음
      (device as any).addEventListener('gattserverdisconnected', () => {
        console.log('⚠️ 기기 연결 해제됨');
        this.device = null;
        this.server = null;
      });

      console.log('✅ 블루투스 기기 연결 완료');
      console.groupEnd();

      return deviceInfo;
    } catch (error) {
      console.error('❌ 블루투스 기기 연결 실패:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 혈압 데이터 읽기
   */
  async readBloodPressure(): Promise<BloodPressureData | null> {
    try {
      if (!this.server) {
        throw new Error('기기가 연결되지 않았습니다');
      }

      console.group('[BluetoothHealthClient] 혈압 읽기');

      const service = await this.server.getPrimaryService('blood_pressure');
      const characteristic = await service.getCharacteristic('blood_pressure_measurement');

      await characteristic.startNotifications();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          characteristic.stopNotifications();
          reject(new Error('혈압 읽기 타임아웃'));
        }, 15000); // 15초 타임아웃

        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          
          // BLE Blood Pressure Profile 형식 파싱
          // Flags (1 byte) + Systolic (2 bytes) + Diastolic (2 bytes) + ...
          const flags = value.getUint8(0);
          const systolic = value.getUint16(1, true); // Little-endian
          const diastolic = value.getUint16(3, true);
          
          let pulse: number | undefined;
          // Pulse Rate Present 플래그 확인
          if (flags & 0x04) {
            pulse = value.getUint16(5, true);
          }

          clearTimeout(timeout);
          characteristic.stopNotifications();

          const result: BloodPressureData = {
            systolic,
            diastolic,
            pulse,
            timestamp: new Date().toISOString(),
          };

          console.log('✅ 혈압:', `${systolic}/${diastolic} mmHg`, pulse ? `맥박: ${pulse} bpm` : '');
          console.groupEnd();

          resolve(result);
        });
      });
    } catch (error) {
      console.error('❌ 혈압 읽기 실패:', error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * 혈당 데이터 읽기
   */
  async readGlucose(): Promise<GlucoseData | null> {
    try {
      if (!this.server) {
        throw new Error('기기가 연결되지 않았습니다');
      }

      console.group('[BluetoothHealthClient] 혈당 읽기');

      const service = await this.server.getPrimaryService('glucose');
      const characteristic = await service.getCharacteristic('glucose_measurement');

      await characteristic.startNotifications();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          characteristic.stopNotifications();
          reject(new Error('혈당 읽기 타임아웃'));
        }, 15000);

        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          
          // BLE Glucose Profile 형식 파싱
          const flags = value.getUint8(0);
          const sequenceNumber = value.getUint16(1, true);
          
          // Glucose Concentration (SFLOAT 형식)
          const glucoseValue = value.getUint16(3, true);
          // SFLOAT는 IEEE 11073 형식이지만 간단히 처리
          const glucose = glucoseValue / 10; // mg/dL

          let context: GlucoseData['context'] = 'casual';
          if (flags & 0x01) {
            context = 'before_meal';
          } else if (flags & 0x02) {
            context = 'after_meal';
          } else if (flags & 0x04) {
            context = 'fasting';
          }

          clearTimeout(timeout);
          characteristic.stopNotifications();

          const result: GlucoseData = {
            glucose: Math.round(glucose),
            timestamp: new Date().toISOString(),
            context,
          };

          console.log('✅ 혈당:', `${glucose} mg/dL`, `(${context})`);
          console.groupEnd();

          resolve(result);
        });
      });
    } catch (error) {
      console.error('❌ 혈당 읽기 실패:', error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * 체중 데이터 읽기
   */
  async readWeight(): Promise<WeightData | null> {
    try {
      if (!this.server) {
        throw new Error('기기가 연결되지 않았습니다');
      }

      console.group('[BluetoothHealthClient] 체중 읽기');

      const service = await this.server.getPrimaryService('weight_scale');
      const characteristic = await service.getCharacteristic('weight_measurement');

      await characteristic.startNotifications();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          characteristic.stopNotifications();
          reject(new Error('체중 읽기 타임아웃'));
        }, 15000);

        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          
          // BLE Weight Scale Profile 형식 파싱
          const flags = value.getUint8(0);
          let offset = 1;

          // Weight (SFLOAT)
          const weightValue = value.getUint16(offset, true);
          const weight = weightValue / 10; // kg
          offset += 2;

          let bodyFat: number | undefined;
          let muscleMass: number | undefined;

          // Body Fat Percentage Present
          if (flags & 0x02) {
            const bodyFatValue = value.getUint16(offset, true);
            bodyFat = bodyFatValue / 10; // %
            offset += 2;
          }

          // Muscle Mass Present
          if (flags & 0x04) {
            const muscleMassValue = value.getUint16(offset, true);
            muscleMass = muscleMassValue / 10; // kg
          }

          clearTimeout(timeout);
          characteristic.stopNotifications();

          const result: WeightData = {
            weight: Math.round(weight * 10) / 10, // 소수점 1자리
            bodyFat: bodyFat ? Math.round(bodyFat * 10) / 10 : undefined,
            muscleMass: muscleMass ? Math.round(muscleMass * 10) / 10 : undefined,
            timestamp: new Date().toISOString(),
          };

          console.log('✅ 체중:', `${weight} kg`, bodyFat ? `체지방: ${bodyFat}%` : '', muscleMass ? `근육량: ${muscleMass} kg` : '');
          console.groupEnd();

          resolve(result);
        });
      });
    } catch (error) {
      console.error('❌ 체중 읽기 실패:', error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * 체온 데이터 읽기
   */
  async readTemperature(): Promise<TemperatureData | null> {
    try {
      if (!this.server) {
        throw new Error('기기가 연결되지 않았습니다');
      }

      console.group('[BluetoothHealthClient] 체온 읽기');

      const service = await this.server.getPrimaryService('health_thermometer');
      const characteristic = await service.getCharacteristic('temperature_measurement');

      await characteristic.startNotifications();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          characteristic.stopNotifications();
          reject(new Error('체온 읽기 타임아웃'));
        }, 15000);

        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          
          // BLE Health Thermometer Profile 형식 파싱
          const flags = value.getUint8(0);
          let offset = 1;

          // Temperature (IEEE 11073 FLOAT)
          const tempValue = value.getUint32(offset, true);
          // 간단한 변환 (실제로는 IEEE 11073 형식 파싱 필요)
          const temperature = (tempValue & 0x0FFFFFFF) / 100; // °C
          const isFahrenheit = flags & 0x01;
          const finalTemp = isFahrenheit ? (temperature - 32) * 5 / 9 : temperature;

          let type: 'body' | 'surface' = 'body';
          if (flags & 0x02) {
            type = 'surface';
          }

          clearTimeout(timeout);
          characteristic.stopNotifications();

          const result: TemperatureData = {
            temperature: Math.round(finalTemp * 10) / 10, // 소수점 1자리
            timestamp: new Date().toISOString(),
            type,
          };

          console.log('✅ 체온:', `${finalTemp.toFixed(1)}°C`, `(${type})`);
          console.groupEnd();

          resolve(result);
        });
      });
    } catch (error) {
      console.error('❌ 체온 읽기 실패:', error);
      console.groupEnd();
      return null;
    }
  }
}
