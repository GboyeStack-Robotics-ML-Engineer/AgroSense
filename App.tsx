import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  ShieldCheck, 
  Droplets, 
  Bell, 
  Menu, 
  X, 
  Wifi, 
  WifiOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { SensorData, Alert, View } from './types';
import { generateInitialHistory, generateNextReading } from './services/mockData';

// Sub-pages
import DashboardHome from './pages/DashboardHome';
import SoilMonitor from './pages/SoilMonitor';
import LeafHealth from './pages/LeafHealth';
import SecurityMonitor from './pages/SecurityMonitor';

const App: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Init Data
  useEffect(() => {
    setSensorHistory(generateInitialHistory());
  }, []);

  // Data Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorHistory(prev => {
        const last = prev[prev.length - 1];
        const next = generateNextReading(last);
        const newHistory = [...prev.slice(1), next];
        
        // Check for alerts
        checkAlerts(next);
        
        return newHistory;
      });
    }, 3000); // 3 seconds tick

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const checkAlerts = (data: SensorData) => {
    const newAlerts: Alert[] = [];
    
    if (data.moisture < 30) {
      newAlerts.push({
        id: Date.now().toString() + 'm',
        type: 'moisture',
        message: 'Critical Low Moisture! Water crops immediately.',
        timestamp: Date.now(),
        severity: 'critical'
      });
      if (soundEnabled) speak("Alert. Soil moisture critical.");
    }
    
    if (data.temperature > 35) {
      newAlerts.push({
        id: Date.now().toString() + 't',
        type: 'temperature',
        message: 'High Temperature Warning.',
        timestamp: Date.now(),
        severity: 'warning'
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    const latestData = sensorHistory[sensorHistory.length - 1] || { moisture: 0, temperature: 0, humidity: 0, timestamp: 0 };

    switch (currentView) {
      case 'dashboard':
        return <DashboardHome data={latestData} history={sensorHistory} alerts={alerts} onViewChange={setCurrentView} />;
      case 'soil':
        return <SoilMonitor history={sensorHistory} />;
      case 'health':
        return <LeafHealth />;
      case 'security':
        return <SecurityMonitor />;
      default:
        return <DashboardHome data={latestData} history={sensorHistory} alerts={alerts} onViewChange={setCurrentView} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-emerald-100 text-emerald-700 font-medium' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <Sprout className="w-8 h-8" />
              <h1 className="text-xl font-bold tracking-tight">AgroVision</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">SmartEdge AI System</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem view="soil" icon={Droplets} label="Soil Monitor" />
            <NavItem view="health" icon={Sprout} label="Leaf Health" />
            <NavItem view="security" icon={ShieldCheck} label="Farm Security" />
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                {isOnline ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
                <span>{isOnline ? 'System Online' : 'Offline'}</span>
              </div>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-slate-500 hover:text-slate-700">
                 {soundEnabled ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
              </button>
            </div>
            <div className="text-xs text-slate-400">
              v1.2.4 (Simulated)
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-600"
            onClick={toggleSidebar}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 md:px-0">
             <h2 className="text-lg font-medium text-slate-800 capitalize">{currentView.replace('-', ' ')}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-500" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border border-emerald-200">
              F1
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;