import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SensorData } from '../types';

interface SensorChartProps {
  data: SensorData[];
  dataKey: keyof SensorData;
  title: string;
  color: string; // Hex color for the chart line/fill
  unit: string;
  isDarkMode?: boolean;
  threshold?: number;
}

export const SensorChart: React.FC<SensorChartProps> = ({ 
  data, 
  dataKey, 
  title, 
  color, 
  unit, 
  isDarkMode = false,
  threshold 
}) => {
  // Prepare data for chart - we only take last 20 points for clarity
  const chartData = data.slice(-20).map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: typeof d[dataKey] === 'number' ? parseFloat((d[dataKey] as number).toFixed(2)) : 0,
    predicted: null as number | null,
  }));

  // Simple linear projection for "Prediction" (simulating AI model)
  if (chartData.length > 2) {
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    const slope = (last.value || 0) - (prev.value || 0);
    
    // Add 5 future points
    for (let i = 1; i <= 5; i++) {
        chartData.push({
            time: `+${i * 5}s`,
            value: null as any, // Use any to bypass strict type check for chart gap
            predicted: parseFloat(((last.value || 0) + (slope * i)).toFixed(2))
        });
    }
  }

  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#f8fafc' : '#1e293b';

  return (
    <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="time" tick={{fontSize: 12, fill: axisColor}} axisLine={false} tickLine={false} />
            <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 12, fill: axisColor}} 
                axisLine={false} 
                tickLine={false} 
                unit={unit} 
                width={40}
            />
            <Tooltip 
              contentStyle={{backgroundColor: tooltipBg, borderRadius: '8px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: tooltipText}}
              itemStyle={{fontSize: '14px', fontWeight: 500, color: color}}
              formatter={(value: number) => [`${value} ${unit}`, title]}
            />
            {threshold && (
                <ReferenceLine y={threshold} label={{ value: "Threshold", fill: "#ef4444", fontSize: 12 }} stroke="#ef4444" strokeDasharray="3 3" />
            )}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#color${dataKey})`} 
              name={title}
              connectNulls={false}
            />
            <Area 
              type="monotone" 
              dataKey="predicted" 
              stroke={color} 
              strokeWidth={2} 
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill={`url(#color${dataKey})`} 
              name="Predicted"
            />
          </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};