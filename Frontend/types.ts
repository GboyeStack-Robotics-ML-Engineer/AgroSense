export enum SensorStatus {
  OPTIMAL = 'Optimal',
  WARNING = 'Warning',
  CRITICAL = 'Critical',
}

export interface SensorData {
  id?: number; // Database ID
  sensorId?: number; // Sensor set identifier from hardware
  timestamp: number;
  moisture: number; // 0-100%
  temperature: number; // Celsius
  humidity: number; // 0-100%
  ph: number; // 0-14
  zone?: string; // Sensor zone/location
}

export interface Alert {
  id: string;
  type: 'moisture' | 'temperature' | 'motion' | 'health';
  message: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
}

export interface PlantImage {
  id: string;
  url: string;
  timestamp: number;
  status: 'healthy' | 'stress' | 'analyzing';
  analysis?: string;
}

export interface MotionEvent {
  id: string;
  url: string;
  timestamp: number;
  detectedObject?: string;
}

export type View = 'dashboard' | 'soil' | 'health' | 'security';