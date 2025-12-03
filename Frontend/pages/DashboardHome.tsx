import React, { useState } from 'react';
import { 
  Droplets, 
  Thermometer, 
  CloudRain, 
  AlertTriangle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  FlaskConical,
  Sprout,
  ShieldCheck,
  ExternalLink,
  Activity
} from 'lucide-react';
import { SensorData, Alert, View } from '../types';
import { StatCard } from '../components/StatCard';
import { SensorChart } from '../components/MoistureChart';
import { mockPlantImages, mockMotionEvents } from '../services/mockData';

interface DashboardHomeProps {
  data: SensorData;
  history: SensorData[];
  alerts: Alert[];
  onViewChange: (view: View) => void;
  isDarkMode?: boolean;
  selectedSensorId?: number | null;
}

const SENSORS = [
  { key: 'moisture', label: 'Soil Moisture', unit: '%', color: '#10b981', threshold: 30 },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#f97316', threshold: 35 },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#6366f1' },
  { key: 'ph', label: 'Soil pH', unit: '', color: '#8b5cf6' }
];

const DashboardHome: React.FC<DashboardHomeProps> = ({ data, history, alerts, onViewChange, isDarkMode, selectedSensorId = null }) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(true);
  const [sensorIndex, setSensorIndex] = useState(0);

  const moistureStatus = data.moisture < 30 ? 'critical' : data.moisture < 50 ? 'warning' : 'normal';
  const phStatus = data.ph < 5.5 || data.ph > 7.5 ? 'warning' : 'normal';

  const currentSensor = SENSORS[sensorIndex];
  
  // Get latest preview data
  const latestLeaf = mockPlantImages[0];
  const latestMotion = mockMotionEvents[0];

  const nextSensor = () => {
    setSensorIndex((prev) => (prev + 1) % SENSORS.length);
  };

  const prevSensor = () => {
    setSensorIndex((prev) => (prev - 1 + SENSORS.length) % SENSORS.length);
  };
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Farm Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Real-time monitoring and AI insights.</p>
        </div>
        <button 
          onClick={() => onViewChange('health')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <span>Check Crop Health</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard 
          title="Soil Moisture"
          value={data.moisture.toFixed(1)}
          unit="%"
          icon={Droplets}
          color="text-blue-500"
          status={moistureStatus}
          trend={data.moisture < 40 ? "Dropping" : "Stable"}
        />
        <StatCard 
          title="Temperature"
          value={data.temperature.toFixed(1)}
          unit="°C"
          icon={Thermometer}
          color="text-orange-500"
          status={data.temperature > 32 ? 'warning' : 'normal'}
        />
        <StatCard 
          title="Humidity"
          value={data.humidity.toFixed(1)}
          unit="%"
          icon={CloudRain}
          color="text-indigo-500"
        />
        <StatCard 
          title="Soil pH"
          value={data.ph.toFixed(2)}
          unit=""
          icon={FlaskConical}
          color="text-purple-500"
          status={phStatus}
        />
      </div>

      {/* Main Chart Section with Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
         {/* Header with Arrows */}
         <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <button 
                onClick={prevSensor}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title="Previous Sensor"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center justify-center gap-2">
                    {currentSensor.label} Trends & Prediction
                </h3>
                <div className="flex items-center justify-center gap-4 text-xs mt-1">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSensor.color }}></span>
                        <span className="text-slate-600 dark:text-slate-400">Historical</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: currentSensor.color }}></span>
                        <span className="text-slate-600 dark:text-slate-400">AI Predicted</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={nextSensor}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title="Next Sensor"
            >
                <ChevronRight className="w-6 h-6" />
            </button>
         </div>

         {/* Chart Body */}
         <div className="p-4">
             <SensorChart 
                key={`${currentSensor.key}-${selectedSensorId}`}  // Force re-render when metric or sensor changes
                data={history} 
                dataKey={currentSensor.key as any} 
                title={currentSensor.label}
                color={currentSensor.color}
                unit={currentSensor.unit}
                threshold={currentSensor.threshold}
                isDarkMode={isDarkMode}
                selectedSensorId={selectedSensorId}
            />
         </div>
      </div>

      {/* Insights & Security Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Leaf Health Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col transition-colors duration-300">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <h3 className="font-semibold text-slate-800 dark:text-white">Recent Crop Health</h3>
              </div>
              <button 
                onClick={() => onViewChange('health')}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View Details <ExternalLink className="w-3 h-3" />
              </button>
           </div>

           <div className="flex gap-4 items-start">
              <img 
                src={latestLeaf.url} 
                alt="Leaf Analysis" 
                className="w-24 h-24 rounded-lg object-cover border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              />
              <div className="flex-1 space-y-2">
                 <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                        latestLeaf.status === 'healthy' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    }`}>
                        {latestLeaf.status}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(latestLeaf.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {latestLeaf.analysis || "Analysis pending..."}
                 </p>
              </div>
           </div>
        </div>

        {/* Security Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col transition-colors duration-300">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                 </div>
                 <h3 className="font-semibold text-slate-800 dark:text-white">Security Feed</h3>
              </div>
              <button 
                onClick={() => onViewChange('security')}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View Feed <ExternalLink className="w-3 h-3" />
              </button>
           </div>

           <div className="relative rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 group">
              <img 
                src={latestMotion.url} 
                alt="Motion Capture" 
                className="w-full h-32 object-cover transition-transform duration-700 group-hover:scale-105 bg-slate-100 dark:bg-slate-800"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                 <div className="w-full flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-red-400 animate-pulse" />
                        <span className="text-xs font-medium truncate max-w-[150px]">{latestMotion.detectedObject || "Motion Detected"}</span>
                    </div>
                    <span className="text-xs opacity-80">{new Date(latestMotion.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Alerts Section - Collapsible */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div 
          className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none"
          onClick={() => setIsAlertsOpen(!isAlertsOpen)}
        >
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Recent Alerts
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
              {alerts.length} Total
            </span>
            {isAlertsOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
        
        {isAlertsOpen && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                {alerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">No active alerts. System is optimal.</div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className={`p-4 flex items-start gap-3 ${alert.severity === 'critical' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                alert.severity === 'critical' ? 'bg-red-500' : 
                                alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{alert.message}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {new Date(alert.timestamp).toLocaleTimeString()} • {alert.type.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;