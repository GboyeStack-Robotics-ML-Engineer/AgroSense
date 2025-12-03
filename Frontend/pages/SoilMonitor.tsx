import React, { useState } from 'react';
import { SensorData } from '../types';
import { SensorChart } from '../components/MoistureChart';
import { getFarmingAdvice } from '../services/geminiService';
import { Sparkles, Send, Loader2 } from 'lucide-react';

interface SoilMonitorProps {
  history: SensorData[];
  isDarkMode?: boolean;
  selectedSensorId?: number | null;
}

const SoilMonitor: React.FC<SoilMonitorProps> = ({ history, isDarkMode, selectedSensorId = null }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'moisture' | 'temperature' | 'humidity' | 'ph'>('moisture');
  
  const latest = history[history.length - 1] || { moisture: 0, temperature: 0, humidity: 0, ph: 7.0, timestamp: 0 };

  const handleAskAI = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    const context = `Current Soil Moisture: ${latest.moisture.toFixed(1)}%, Temperature: ${latest.temperature.toFixed(1)}C. Trend: Moisture is ${latest.moisture < 40 ? 'low' : 'optimal'}.`;
    
    const response = await getFarmingAdvice(context, question);
    setAnswer(response);
    setIsLoading(false);
    setQuestion('');
  };

  const tabs = [
    { key: 'moisture' as const, label: 'Moisture', color: '#10b981', unit: '%', threshold: 30 },
    { key: 'temperature' as const, label: 'Temperature', color: '#f59e0b', unit: '°C', threshold: undefined },
    { key: 'humidity' as const, label: 'Humidity', color: '#3b82f6', unit: '%', threshold: undefined },
    { key: 'ph' as const, label: 'pH Level', color: '#8b5cf6', unit: '', threshold: undefined }
  ];

  const activeTabConfig = tabs.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Soil Monitor</h1>
        <p className="text-slate-500 dark:text-slate-400">Detailed analytics and AI advisory.</p>
      </header>

      {/* Metric Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border-2'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            style={{ borderColor: activeTab === tab.key ? tab.color : undefined }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="mb-4 flex items-center justify-between">
             <h3 className="font-semibold text-slate-800 dark:text-white">Real-time {activeTabConfig.label} Trends</h3>
             <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full font-medium">Live</span>
        </div>
        <SensorChart 
            key={activeTab}  // Force re-render when tab changes
            data={history} 
            dataKey={activeTab} 
            title={activeTabConfig.label} 
            color={activeTabConfig.color} 
            unit={activeTabConfig.unit} 
            isDarkMode={isDarkMode}
            threshold={activeTabConfig.threshold}
            selectedSensorId={selectedSensorId}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Advisor */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h3 className="font-semibold text-lg">AI Soil Advisor</h3>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 min-h-[120px] mb-4 text-sm leading-relaxed text-emerald-50">
             {isLoading ? (
                 <div className="flex items-center justify-center h-full gap-2 text-emerald-200">
                     <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                 </div>
             ) : answer ? (
                 answer
             ) : (
                 "Ask me anything about your soil data. I can help with irrigation schedules or crop suggestions based on current moisture levels."
             )}
          </div>

          <div className="relative">
            <input 
               type="text" 
               value={question}
               onChange={(e) => setQuestion(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
               placeholder="E.g., Should I water the crops today?"
               className="w-full bg-emerald-950/30 border border-emerald-600/50 rounded-lg py-3 pl-4 pr-12 text-sm text-white placeholder:text-emerald-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button 
               onClick={handleAskAI}
               disabled={isLoading}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-300 hover:text-white disabled:opacity-50"
            >
                <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Manual Logs / Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors duration-300">
           <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Sensor Configuration</h3>
           <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Sensor Type</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Capacitive Soil Moisture v1.2</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Calibration</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Wet: 3200mv, Dry: 1500mv</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Last Polling</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Just now</span>
              </div>
               <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Threshold Alert</span>
                  <span className="font-medium text-red-500">&lt; 30%</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SoilMonitor;