import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Line, ComposedChart 
} from 'recharts';
import { SensorData } from '../types';
import { 
  Clock, X, Expand, Crosshair, 
  TrendingUp, TrendingDown, Activity, RotateCcw, Minus, Plus,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface SensorChartProps {
  data: SensorData[];
  dataKey: keyof SensorData;
  title: string;
  color: string;
  unit: string;
  isDarkMode?: boolean;
  threshold?: number;
  selectedSensorId?: number | null;
  isLive?: boolean;  // Whether the sensor is currently online and streaming data
}

type TimeRange = '5m' | '15m' | '30m' | '1h' | 'all';

export const SensorChart: React.FC<SensorChartProps> = ({ 
  data, 
  dataKey, 
  title, 
  color, 
  unit, 
  isDarkMode = false,
  threshold,
  selectedSensorId = null,
  isLive = false
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Crypto chart states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastPanX = useRef(0);
  
  // Cache for offline sensor data - when sensor goes offline, we freeze its data
  const cachedOfflineData = useRef<SensorData[]>([]);
  const wasLive = useRef(isLive);
  const lastSelectedSensorId = useRef(selectedSensorId);

  // Clear cache when switching sensors
  useEffect(() => {
    if (lastSelectedSensorId.current !== selectedSensorId) {
      cachedOfflineData.current = [];
      wasLive.current = isLive;
      lastSelectedSensorId.current = selectedSensorId;
      console.log(`🔄 Cleared cache - switched to sensor ${selectedSensorId}`);
    }
  }, [selectedSensorId, isLive]);

  // Filter data based on sensor selection
  const getSensorFilteredData = () => {
    if (selectedSensorId === null) {
      const timestampMap = new Map<number, { sum: number; count: number; ids: Set<number> }>();
      
      data.forEach(d => {
        const ts = d.timestamp;
        if (!timestampMap.has(ts)) {
          timestampMap.set(ts, { sum: 0, count: 0, ids: new Set() });
        }
        const entry = timestampMap.get(ts)!;
        const value = typeof d[dataKey] === 'number' ? d[dataKey] as number : 0;
        entry.sum += value;
        entry.count += 1;
        if (d.sensorId) entry.ids.add(d.sensorId);
      });
      
      return Array.from(timestampMap.entries()).map(([timestamp, { sum, count }]) => ({
        timestamp,
        moisture: dataKey === 'moisture' ? sum / count : 0,
        temperature: dataKey === 'temperature' ? sum / count : 0,
        humidity: dataKey === 'humidity' ? sum / count : 0,
        ph: dataKey === 'ph' ? sum / count : 0,
        sensorId: 0,
        zone: 'All Sensors'
      }));
    }
    
    return data.filter(d => d.sensorId === selectedSensorId);
  };

  // Get the data to use - either live data or cached offline data
  const getDataToUse = (): SensorData[] => {
    const currentData = getSensorFilteredData();
    
    // If sensor just went offline, cache the current data
    if (wasLive.current && !isLive) {
      cachedOfflineData.current = [...currentData];
      console.log(`📦 Cached ${currentData.length} readings for offline sensor ${selectedSensorId}`);
    }
    
    // Update the previous live state
    wasLive.current = isLive;
    
    // If sensor is offline, use cached data; otherwise use live data
    if (!isLive && cachedOfflineData.current.length > 0) {
      return cachedOfflineData.current;
    }
    
    return currentData;
  };

  // Filter data based on time range (relative to the most recent data point)
  // AND calculate the fixed time window for X-axis domain
  const getFilteredDataAndDomain = () => {
    const sensorFiltered = getDataToUse();
    
    if (sensorFiltered.length === 0) {
      return { data: [], domain: [Date.now() - 5 * 60 * 1000, Date.now()] as [number, number] };
    }
    
    // Find the most recent timestamp in the data
    const latestTimestamp = Math.max(...sensorFiltered.map(d => d.timestamp));
    
    const ranges: Record<TimeRange, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      'all': 0  // Will be calculated from data
    };
    
    let domainStart: number;
    let domainEnd: number;
    
    if (timeRange === 'all') {
      // For 'all', use the full data range
      const earliestTimestamp = Math.min(...sensorFiltered.map(d => d.timestamp));
      domainStart = earliestTimestamp;
      domainEnd = latestTimestamp;
      return { data: sensorFiltered, domain: [domainStart, domainEnd] as [number, number] };
    }
    
    // For specific time ranges, set a fixed window
    const interval = ranges[timeRange];
    domainEnd = latestTimestamp;
    domainStart = latestTimestamp - interval;
    
    // Filter data to only include points within this window
    const filtered = sensorFiltered.filter(d => d.timestamp >= domainStart && d.timestamp <= domainEnd);
    
    return { data: filtered, domain: [domainStart, domainEnd] as [number, number] };
  };

  const { data: filteredData, domain: timeDomain } = getFilteredDataAndDomain();

  // Debug logging
  console.log(`📊 Chart [${title}]: timeRange=${timeRange}, dataPoints=${filteredData.length}, domain=[${new Date(timeDomain[0]).toLocaleTimeString()}, ${new Date(timeDomain[1]).toLocaleTimeString()}], isLive=${isLive}`);

  // Apply zoom and pan (only for expanded view)
  const getVisibleData = useCallback(() => {
    const totalPoints = filteredData.length;
    const visiblePoints = Math.max(10, Math.floor(totalPoints / zoomLevel));
    const maxOffset = Math.max(0, totalPoints - visiblePoints);
    const actualOffset = Math.min(Math.max(0, panOffset), maxOffset);
    
    return filteredData.slice(actualOffset, actualOffset + visiblePoints);
  }, [filteredData, zoomLevel, panOffset]);

  const visibleData = getVisibleData();

  // Prepare chart data for expanded crypto chart (with zoom/pan)
  const chartData = visibleData.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    fullTime: new Date(d.timestamp).toLocaleString(),
    timestamp: d.timestamp,
    value: typeof d[dataKey] === 'number' ? parseFloat((d[dataKey] as number).toFixed(2)) : 0,
  }));

  // Prepare chart data for simple chart (no zoom/pan - shows all filtered data)
  const simpleChartData = filteredData.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    fullTime: new Date(d.timestamp).toLocaleString(),
    timestamp: d.timestamp,
    value: typeof d[dataKey] === 'number' ? parseFloat((d[dataKey] as number).toFixed(2)) : 0,
  }));

  // Calculate stats from all visible data (for expanded) or all filtered data (for simple)
  const getStats = (data: typeof chartData) => ({
    current: data.length > 0 ? data[data.length - 1]?.value : 0,
    high: data.length > 0 ? Math.max(...data.map(d => d.value)) : 0,
    low: data.length > 0 ? Math.min(...data.map(d => d.value)) : 0,
    avg: data.length > 0 ? data.reduce((a, b) => a + b.value, 0) / data.length : 0,
    change: data.length > 1 ? data[data.length - 1]?.value - data[0]?.value : 0,
    changePercent: data.length > 1 && data[0]?.value !== 0 
      ? ((data[data.length - 1]?.value - data[0]?.value) / data[0]?.value) * 100 
      : 0
  });

  const stats = getStats(simpleChartData);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isExpanded) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoomLevel(prev => Math.max(1, Math.min(10, prev + delta)));
  }, [isExpanded]);

  // Mouse pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isExpanded) return;
    setIsPanning(true);
    lastPanX.current = e.clientX;
  }, [isExpanded]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isExpanded) return;
    
    if (chartContainerRef.current && showCrosshair) {
      const rect = chartContainerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    if (isPanning) {
      const deltaX = e.clientX - lastPanX.current;
      const sensitivity = 0.5;
      setPanOffset(prev => Math.max(0, prev - Math.floor(deltaX * sensitivity)));
      lastPanX.current = e.clientX;
    }
  }, [isExpanded, isPanning, showCrosshair]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setMousePosition(null);
  }, []);

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  const panLeft = () => setPanOffset(prev => Math.max(0, prev - 10));
  const panRight = () => setPanOffset(prev => prev + 10);

  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';
  const gradientId = `gradient-${String(dataKey)}-${selectedSensorId || 'all'}-${isExpanded ? 'exp' : 'norm'}`;

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: 'all', label: 'All' }
  ];

  // Format timestamp for X-axis labels based on time range
  const formatXAxisTick = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === '1h' || timeRange === 'all') {
      // For longer ranges, show only hour:minute
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // For shorter ranges (5m, 15m, 30m), show minute:second
    return date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
  };

  // Calculate appropriate number of ticks based on time range
  const getTickCount = () => {
    switch (timeRange) {
      case '5m': return 5;    // Show ~1 tick per minute
      case '15m': return 5;   // Show ~1 tick per 3 minutes  
      case '30m': return 6;   // Show ~1 tick per 5 minutes
      case '1h': return 6;    // Show ~1 tick per 10 minutes
      case 'all': return 6;   // Show ~6 evenly spaced ticks
      default: return 5;
    }
  };

  // Simple chart for non-expanded view
  const renderSimpleChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart 
        data={simpleChartData} 
        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis 
          dataKey="timestamp"
          type="number"
          domain={timeDomain}
          scale="time"
          tickCount={getTickCount()}
          tick={{fontSize: 11, fill: axisColor}} 
          axisLine={false} 
          tickLine={false}
          tickFormatter={formatXAxisTick}
        />
        <YAxis 
          domain={['auto', 'auto']} 
          tick={{fontSize: 12, fill: axisColor}} 
          axisLine={false} 
          tickLine={false} 
          unit={unit} 
          width={50}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
            borderRadius: '8px', 
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            color: isDarkMode ? '#f8fafc' : '#1e293b'
          }}
          labelFormatter={(timestamp: number) => new Date(timestamp).toLocaleString()}
          formatter={(value: number) => [`${value} ${unit}`, title]}
        />
        {threshold && (
          <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="3 3" />
        )}
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2} 
          fillOpacity={1} 
          fill={`url(#${gradientId})`}
          isAnimationActive={isLive}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // Crypto-style chart for expanded view
  const renderCryptoChart = () => (
    <div 
      ref={chartContainerRef}
      className="relative h-full w-full cursor-crosshair select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {showCrosshair && mousePosition && (
        <>
          <div 
            className="absolute pointer-events-none z-10 border-l border-dashed"
            style={{ 
              left: mousePosition.x, 
              top: 0, 
              height: '100%',
              borderColor: isDarkMode ? '#475569' : '#94a3b8'
            }}
          />
          <div 
            className="absolute pointer-events-none z-10 border-t border-dashed"
            style={{ 
              top: mousePosition.y, 
              left: 0, 
              width: '100%',
              borderColor: isDarkMode ? '#475569' : '#94a3b8'
            }}
          />
        </>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={simpleChartData} 
          margin={{ top: 20, right: 80, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id={`${gradientId}-crypto`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="100%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="1 3" 
            stroke={isDarkMode ? '#1e3a5f' : '#e2e8f0'} 
            vertical={true}
          />
          
          <XAxis 
            dataKey="timestamp"
            type="number"
            domain={timeDomain}
            scale="time"
            tickCount={getTickCount()}
            tick={{fontSize: 11, fill: isDarkMode ? '#64748b' : '#94a3b8'}} 
            axisLine={{ stroke: isDarkMode ? '#1e3a5f' : '#e2e8f0' }}
            tickLine={{ stroke: isDarkMode ? '#1e3a5f' : '#e2e8f0' }}
            tickFormatter={formatXAxisTick}
          />
          
          <YAxis 
            domain={['dataMin - 2', 'dataMax + 2']} 
            tick={{fontSize: 12, fill: isDarkMode ? '#64748b' : '#94a3b8'}} 
            axisLine={{ stroke: isDarkMode ? '#1e3a5f' : '#e2e8f0' }}
            tickLine={{ stroke: isDarkMode ? '#1e3a5f' : '#e2e8f0' }}
            orientation="right"
            tickFormatter={(value) => `${value}${unit}`}
          />
          
          <Tooltip 
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className={`p-3 rounded-lg shadow-xl border ${
                  isDarkMode 
                    ? 'bg-slate-800/95 border-slate-600 text-white' 
                    : 'bg-white/95 border-slate-200 text-slate-900'
                }`}>
                  <div className="text-xs text-slate-400 mb-2">{d.fullTime}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono text-lg font-bold">{d.value}{unit}</span>
                  </div>
                </div>
              );
            }}
          />
          
          {threshold && (
            <ReferenceLine 
              y={threshold} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: `Alert: ${threshold}${unit}`, 
                fill: '#ef4444', 
                fontSize: 12,
                position: 'left'
              }}
            />
          )}
          
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            fillOpacity={1} 
            fill={`url(#${gradientId}-crypto)`}
            dot={false}
            activeDot={{ 
              r: 6, 
              stroke: color, 
              strokeWidth: 2, 
              fill: isDarkMode ? '#0f172a' : '#fff' 
            }}
          />
          
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {chartData.length > 0 && (
        <div 
          className="absolute right-0 transform -translate-y-1/2 px-2 py-1 rounded-l text-xs font-mono font-bold text-white"
          style={{ 
            backgroundColor: stats.change >= 0 ? '#10b981' : '#ef4444',
            top: '50%'
          }}
        >
          {stats.current.toFixed(1)}{unit}
        </div>
      )}
    </div>
  );

  const renderSimpleToolbar = () => (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {selectedSensorId === null ? 'All Sensors' : `Sensor #${selectedSensorId}`}
        </span>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        {timeRanges.map(range => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
              timeRange === range.value
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {range.label}
          </button>
        ))}
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button
          onClick={() => setIsExpanded(true)}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          title="Expand Chart"
        >
          <Expand className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-80 w-full flex flex-col">
        {renderSimpleToolbar()}
        <div className="flex-1 min-h-0">
          {renderSimpleChart()}
        </div>
      </div>

      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExpanded(false);
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          
          <div className={`relative w-[95vw] h-[90vh] rounded-xl overflow-hidden shadow-2xl border
            ${isDarkMode 
              ? 'bg-[#0a0e17] border-slate-800' 
              : 'bg-slate-50 border-slate-200'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b
              ${isDarkMode ? 'bg-[#0f1629] border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                    style={{ backgroundColor: `${color}20` }}>
                    <Activity className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold" style={{ color }}>
                        {stats.current.toFixed(2)}{unit}
                      </span>
                      <span className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded ${
                        stats.change >= 0 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {stats.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`flex gap-6 px-6 py-2 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                  <div className="text-center">
                    <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>High</div>
                    <div className={`font-mono font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {stats.high.toFixed(1)}{unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Low</div>
                    <div className={`font-mono font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {stats.low.toFixed(1)}{unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Avg</div>
                    <div className={`font-mono font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {stats.avg.toFixed(1)}{unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Points</div>
                    <div className={`font-mono font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {simpleChartData.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  {timeRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => { setTimeRange(range.value); handleReset(); }}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                        timeRange === range.value
                          ? isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                          : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>

                <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />

                <div className={`flex rounded-lg p-1 gap-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <button
                    onClick={() => setShowCrosshair(!showCrosshair)}
                    className={`p-2 rounded transition-all ${
                      showCrosshair
                        ? 'bg-emerald-600 text-white'
                        : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Toggle Crosshair"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                  <button
                    onClick={panLeft}
                    className={`p-2 rounded ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-300'}`}
                    title="Pan Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={panRight}
                    className={`p-2 rounded ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-300'}`}
                    title="Pan Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(10, prev + 0.5))}
                    className={`p-2 rounded ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-300'}`}
                    title="Zoom In"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
                    className={`p-2 rounded ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-300'}`}
                    title="Zoom Out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleReset}
                    className={`p-2 rounded ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-300'}`}
                    title="Reset View"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />

                <button
                  onClick={() => setIsExpanded(false)}
                  className={`p-2 rounded-lg ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[calc(100%-72px)] p-4">
              {renderCryptoChart()}
            </div>

            {/* Status Bar */}
            <div className={`absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center justify-between text-xs
              ${isDarkMode ? 'bg-[#0f1629] border-t border-slate-800 text-slate-500' : 'bg-white border-t border-slate-200 text-slate-400'}`}
            >
              <div className="flex items-center gap-4">
                <span>Zoom: {zoomLevel.toFixed(1)}x</span>
                <span>•</span>
                <span>Scroll to zoom • Drag to pan</span>
              </div>
              <div className="flex items-center gap-4">
                <span>{selectedSensorId === null ? 'All Sensors (Averaged)' : `Sensor #${selectedSensorId}`}</span>
                <span>•</span>
                <span>Last update: {simpleChartData.length > 0 ? simpleChartData[simpleChartData.length - 1]?.fullTime : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};