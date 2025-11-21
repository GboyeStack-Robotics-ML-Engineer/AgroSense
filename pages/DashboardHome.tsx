import React from 'react';
import { Droplets, Thermometer, CloudRain, AlertTriangle, ArrowRight } from 'lucide-react';
import { SensorData, Alert, View } from '../types';
import { StatCard } from '../components/StatCard';
import { MoistureChart } from '../components/MoistureChart';

interface DashboardHomeProps {
  data: SensorData;
  history: SensorData[];
  alerts: Alert[];
  onViewChange: (view: View) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ data, history, alerts, onViewChange }) => {
  
  const moistureStatus = data.moisture < 30 ? 'critical' : data.moisture < 50 ? 'warning' : 'normal';
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Farm Dashboard</h1>
          <p className="text-slate-500">Real-time monitoring and AI insights.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Soil Moisture"
          value={data.moisture.toFixed(1)}
          unit="%"
          icon={Droplets}
          color="text-blue-500"
          status={moistureStatus}
          trend={data.moisture < 40 ? "Dropping fast" : "Stable"}
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
      </div>

      {/* Main Chart */}
      <MoistureChart data={history} />

      {/* Alerts Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            Recent Alerts
          </h3>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
            {alerts.length} Total
          </span>
        </div>
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">No active alerts. System is optimal.</div>
            ) : (
                alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 flex items-start gap-3 ${alert.severity === 'critical' ? 'bg-red-50/50' : ''}`}>
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                            alert.severity === 'critical' ? 'bg-red-500' : 
                            alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {new Date(alert.timestamp).toLocaleTimeString()} • {alert.type.toUpperCase()}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;