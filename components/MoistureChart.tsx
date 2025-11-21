import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SensorData } from '../types';

interface MoistureChartProps {
  data: SensorData[];
}

export const MoistureChart: React.FC<MoistureChartProps> = ({ data }) => {
  // Prepare data for chart - we only take last 20 points for clarity
  const chartData = data.slice(-20).map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    moisture: parseFloat(d.moisture.toFixed(1)),
    predicted: null as number | null,
  }));

  // Simple linear projection for "Prediction" (simulating AI model)
  if (chartData.length > 2) {
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    const slope = last.moisture - prev.moisture;
    
    // Add 5 future points
    for (let i = 1; i <= 5; i++) {
        chartData.push({
            time: `+${i * 5}s`,
            moisture: null as any, // Use any to bypass strict type check for chart gap
            predicted: parseFloat(Math.max(0, last.moisture + (slope * i)).toFixed(1))
        });
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Soil Moisture Trends & Prediction</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            <span className="text-slate-600">AI Predicted</span>
          </div>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} unit="%" />
            <Tooltip 
              contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              itemStyle={{fontSize: '14px', fontWeight: 500}}
            />
            <ReferenceLine y={30} label="Dry Threshold" stroke="red" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="moisture" 
              stroke="#10b981" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorMoisture)" 
              name="Moisture"
              connectNulls={false}
            />
            <Area 
              type="monotone" 
              dataKey="predicted" 
              stroke="#6366f1" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill="url(#colorPredicted)" 
              name="Predicted"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};