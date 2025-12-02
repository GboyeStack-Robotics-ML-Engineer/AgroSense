import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  ShieldCheck, 
  Droplets, 
  Bell, 
  Menu, 
  Wifi, 
  WifiOff,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { SensorData, Alert, View } from './types';
import { generateInitialHistory, generateNextReading } from './services/mockData';

// Sub-pages
import DashboardHome from './pages/DashboardHome';
import SoilMonitor from './pages/SoilMonitor';
import LeafHealth from './pages/LeafHealth';
import SecurityMonitor from './pages/SecurityMonitor';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  // State
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop sidebar collapse state
  const [isOnline, setIsOnline] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Init Data
  useEffect(() => {
    setSensorHistory(generateInitialHistory());
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Data Loop
  useEffect(() => {
    // Keep data running in background even if on landing page, or pause it.
    // Let's keep it running so graphs are full when entered.
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
      if (soundEnabled && !showLandingPage) speak("Alert. Soil moisture critical.");
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const renderContent = () => {
    // Updated fallback object to include 'ph'
    const latestData = sensorHistory[sensorHistory.length - 1] || { 
      moisture: 0, 
      temperature: 0, 
      humidity: 0, 
      ph: 7.0, 
      timestamp: 0 
    };

    switch (currentView) {
      case 'dashboard':
        return <DashboardHome data={latestData} history={sensorHistory} alerts={alerts} onViewChange={setCurrentView} isDarkMode={isDarkMode} />;
      case 'soil':
        return <SoilMonitor history={sensorHistory} isDarkMode={isDarkMode} />;
      case 'health':
        return <LeafHealth />;
      case 'security':
        return <SecurityMonitor />;
      default:
        return <DashboardHome data={latestData} history={sensorHistory} alerts={alerts} onViewChange={setCurrentView} isDarkMode={isDarkMode} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
      className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 overflow-hidden
        ${isCollapsed ? 'justify-center px-2 w-full' : 'w-full px-4'}
        ${currentView === view 
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${currentView === view ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`} />
      <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
        {label}
      </span>
    </button>
  );

  // Determine if there are critical alerts for the red pulse
  const hasCriticalAlerts = alerts.some(alert => alert.severity === 'critical');

  // Render Landing Page if state is true
  if (showLandingPage) {
    return (
      <LandingPage 
        onNavigate={(view) => {
          setCurrentView(view);
          setShowLandingPage(false);
        }} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleDarkMode}
      />
    );
  }

  // Render Main App
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        w-64
      `}>
        {/* Desktop Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-9 z-40 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm hover:shadow-md transition-all"
        >
           {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className="h-full flex flex-col">
          {/* Header */}
          <div className={`h-20 border-b border-slate-100 dark:border-slate-800 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-start px-6'}`}>
            <div 
              className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500 overflow-hidden cursor-pointer"
              onClick={() => setShowLandingPage(true)}
              title="Back to Home"
            >
              <Sprout className={`w-8 h-8 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? 'scale-110' : ''}`} />
              <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">AgroVision</h1>
                <p className="text-xs text-slate-400 font-medium whitespace-nowrap">SmartEdge AI System</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-2 overflow-x-hidden">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem view="soil" icon={Droplets} label="Soil Monitor" />
            <NavItem view="health" icon={Sprout} label="Leaf Health" />
            <NavItem view="security" icon={ShieldCheck} label="Farm Security" />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
            <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-4 justify-center' : 'justify-between mb-4'}`}>
              <div className={`flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 ${isCollapsed ? 'justify-center' : ''}`}>
                {isOnline ? <Wifi className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <WifiOff className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                   {isOnline ? 'System Online' : 'Offline'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={toggleDarkMode} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="Toggle Theme">
                    {isDarkMode ? <Moon className="w-4 h-4 flex-shrink-0" /> : <Sun className="w-4 h-4 flex-shrink-0" />}
                </button>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title={soundEnabled ? "Mute" : "Unmute"}>
                    {soundEnabled ? <Volume2 className="w-4 h-4 flex-shrink-0"/> : <VolumeX className="w-4 h-4 flex-shrink-0"/>}
                </button>
              </div>
            </div>
            <div className={`text-xs text-slate-400 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100'}`}>
              v1.2.5 (Simulated)
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400"
              onClick={toggleSidebar}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 capitalize">{currentView.replace('-', ' ')}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Enhanced Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative focus:outline-none"
                title="Notifications"
              >
                <Bell className={`w-5 h-5 ${alerts.length > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`} />
                {alerts.length > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    hasCriticalAlerts 
                    ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                    : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                  }`} />
                )}
              </button>

              {/* Dropdown Menu */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                          Notifications
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{alerts.length}</span>
                        </h3>
                        {alerts.length > 0 && (
                            <button 
                                onClick={() => { setAlerts([]); setIsNotificationsOpen(false); }}
                                className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                <Bell className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-sm font-medium">No new notifications</p>
                                <p className="text-xs mt-1 opacity-70">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className={`p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                        alert.severity === 'critical' ? 'bg-red-50/40 dark:bg-red-900/10' : ''
                                    }`}>
                                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                            alert.severity === 'critical' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]' : 
                                            alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{alert.message}</p>
                                            <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-between">
                                                <span className="uppercase tracking-wide text-[10px] font-semibold opacity-80">{alert.type}</span>
                                                <span>{new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
              )}
            </div>

            {/* Profile Badge */}
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm border border-emerald-200 dark:border-emerald-800">
              F1
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;