import { SensorData, Alert, PlantImage, MotionEvent } from '../types';

const MAX_HISTORY = 50;

// Initial mock history
export const generateInitialHistory = (): SensorData[] => {
  const now = Date.now();
  const history: SensorData[] = [];
  for (let i = MAX_HISTORY; i > 0; i--) {
    history.push({
      timestamp: now - i * 5000, // Every 5 seconds
      moisture: 45 + Math.random() * 10,
      temperature: 24 + Math.random() * 2,
      humidity: 60 + Math.random() * 5,
    });
  }
  return history;
};

export const generateNextReading = (lastReading: SensorData): SensorData => {
  // Random walk behavior
  const moistureChange = (Math.random() - 0.5) * 2;
  const tempChange = (Math.random() - 0.5) * 0.5;
  
  // Clamp values
  let newMoisture = Math.max(0, Math.min(100, lastReading.moisture + moistureChange));
  let newTemp = Math.max(15, Math.min(40, lastReading.temperature + tempChange));
  
  // Simulate drying out over time slightly if not watered
  if (Math.random() > 0.7) newMoisture -= 0.1;

  return {
    timestamp: Date.now(),
    moisture: newMoisture,
    temperature: newTemp,
    humidity: Math.max(0, Math.min(100, lastReading.humidity + (Math.random() - 0.5))),
  };
};

export const mockPlantImages: PlantImage[] = [
  {
    id: '1',
    url: 'https://picsum.photos/id/106/400/300',
    timestamp: Date.now() - 3600000,
    status: 'healthy',
    analysis: 'Leaves appear vibrant green with no signs of chlorosis.',
  },
  {
    id: '2',
    url: 'https://picsum.photos/id/292/400/300',
    timestamp: Date.now() - 7200000,
    status: 'stress',
    analysis: 'Slight yellowing detected at edges. Possible nitrogen deficiency.',
  },
];

export const mockMotionEvents: MotionEvent[] = [
  {
    id: 'm1',
    url: 'https://picsum.photos/id/237/400/300', // Dog
    timestamp: Date.now() - 1800000,
    detectedObject: 'Animal (Dog)',
  },
  {
    id: 'm2',
    url: 'https://picsum.photos/id/1025/400/300', // Pug
    timestamp: Date.now() - 5400000,
    detectedObject: 'Animal (Pug)',
  }
];
