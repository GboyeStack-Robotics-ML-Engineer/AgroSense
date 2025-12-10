import React, { useState, useEffect, useRef } from 'react';
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
  Moon,
  Languages
} from 'lucide-react';
import { SensorData, Alert, View } from './types';

// Sub-pages
import DashboardHome from './pages/DashboardHome';
import SoilMonitor from './pages/SoilMonitor';
import LeafHealth from './pages/LeafHealth';
import SecurityMonitor from './pages/SecurityMonitor';
import LandingPage from './pages/LandingPage';

// Sensor status type
interface SensorStatus {
  online: boolean;
  lastSeen: number; // timestamp
}

// Language types for TTS
type Language = 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';

// Pre-translated alert messages for offline use
const alertTranslations: Record<string, Record<Language, string>> = {
  'moisture_critical': {
    english: 'Alert. Soil moisture critical. Water crops immediately.',
    pidgin: 'Alert o! Water no dey for ground. Abeg water your crop now now!',
    yoruba: 'Ikilo! Omi ile ti dinku pupọ. Jọwọ fun omi si irugbin rẹ bayi.',
    hausa: 'Gargadi! Ruwan ƙasa ya yi ƙasa. Don Allah shayar da amfanin gona yanzu.',
    igbo: 'Ọkwa! Mmiri ala dị obere. Biko nye osikapa mmiri ugbu a.'
  },
  'temperature_high': {
    english: 'Warning. Temperature is too high. Check your crops.',
    pidgin: 'Warning o! Heat too much. Go check your farm quick quick!',
    yoruba: 'Ikilo! Iwọn otutu ga pupọ. Ṣayẹwo irugbin rẹ.',
    hausa: 'Gargadi! Zafin jiki ya yi yawa. Duba amfanin gonar ku.',
    igbo: 'Ọkwa! Okpomọkụ dị elu. Lelee ihe ọkụkụ gị.'
  },
  'humidity_low': {
    english: 'Alert. Humidity is low. Consider irrigation.',
    pidgin: 'Alert! Dampness don low well well. Think about watering.',
    yoruba: 'Ikilo! Ọrinrin kere. Ronu nipa agbe.',
    hausa: 'Gargadi! Danshi ya yi ƙasa. Yi la\'akari da ban ruwa.',
    igbo: 'Ọkwa! Ikuku mmiri dị ala. Chee banyere ịgba mmiri.'
  },
  'sensor_offline': {
    english: 'Sensor has disconnected.',
    pidgin: 'Sensor don comot. E no dey work again.',
    yoruba: 'Sensọ ti ya sọtọ. Ko ṣiṣẹ mọ.',
    hausa: 'Sensor ya katse. Ba ya aiki.',
    igbo: 'Sensa ekwunyịla. Ọ naghị arụ ọrụ.'
  }
};

// Get backend URL dynamically based on how the user accesses the frontend
const getBackendUrl = () => {
  const host = window.location.hostname;
  const backendPort = 8000;
  
  return {
    ws: `ws://${host}:${backendPort}`,
    http: `http://${host}:${backendPort}`
  };
};

const backendUrl = getBackendUrl();

const App: React.FC = () => {
  // State
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null); // null = all sensors
  const [availableSensors, setAvailableSensors] = useState<number[]>([]);
  const [sensorStatuses, setSensorStatuses] = useState<Record<number, SensorStatus>>({}); // Track online/offline status

  // Refs for values used in WebSocket callback (to avoid stale closures)
  const soundEnabledRef = useRef(soundEnabled);
  const showLandingPageRef = useRef(showLandingPage);
  const selectedLanguageRef = useRef(selectedLanguage);
  
  // Keep refs in sync
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { showLandingPageRef.current = showLandingPage; }, [showLandingPage]);
  useEffect(() => { selectedLanguageRef.current = selectedLanguage; }, [selectedLanguage]);

  // Extract unique sensor IDs from data
  useEffect(() => {
    const ids = sensorHistory
      .map(d => d.sensorId)
      .filter((id): id is number => id !== undefined && id !== null);
    const uniqueIds = new Set<number>(ids);
    const sensorIds = Array.from(uniqueIds).sort((a, b) => a - b);
    
    setAvailableSensors(sensorIds);
  }, [sensorHistory]);

  // WebSocket connection for real-time data with auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isComponentMounted = true;
    
    const connect = () => {
      if (!isComponentMounted) return;
      
      const wsUrl = `${backendUrl.ws}/ws/sensor-data`;
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      
      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        scheduleReconnect();
        return;
      }
      
      ws.onopen = () => {
        console.log('🔌 Connected to backend WebSocket');
        setIsOnline(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle initial sensor status sync
          if (message.type === 'sensor_status_init') {
            console.log('📡 Received initial sensor statuses:', message.data);
            const statuses: Record<number, SensorStatus> = {};
            for (const [sensorId, status] of Object.entries(message.data)) {
              const s = status as { online: boolean; lastSeen: string };
              statuses[parseInt(sensorId)] = {
                online: s.online,
                lastSeen: new Date(s.lastSeen).getTime()
              };
            }
            setSensorStatuses(statuses);
          }
          
          // Handle sensor status changes (online/offline)
          if (message.type === 'sensor_status') {
            const { sensorId, online, lastSeen } = message.data;
            console.log(`📡 Sensor ${sensorId} is now ${online ? 'ONLINE' : 'OFFLINE'}`);
            setSensorStatuses(prev => ({
              ...prev,
              [sensorId]: {
                online,
                lastSeen: new Date(lastSeen).getTime()
              }
            }));
            
            // Show alert when sensor goes offline
            if (!online) {
              setAlerts(prev => [{
                id: `sensor-offline-${sensorId}-${Date.now()}`,
                type: 'moisture',
                message: `Sensor #${sensorId} has disconnected`,
                timestamp: Date.now(),
                severity: 'warning'
              }, ...prev].slice(0, 20));
            }
          }
          
          if (message.type === 'sensor_reading') {
            const sensorId = message.data.sensorId || 1;
            
            // Update sensor status to online when we receive data
            setSensorStatuses(prev => ({
              ...prev,
              [sensorId]: {
                online: true,
                lastSeen: Date.now()
              }
            }));
            
            const reading: SensorData = {
              id: message.data.id,
              sensorId: sensorId,
              moisture: message.data.moisture,
              temperature: message.data.temperature,
              humidity: message.data.humidity,
              ph: message.data.ph,
              timestamp: new Date(message.data.timestamp).getTime(),
              zone: message.data.zone
            };
            
            setSensorHistory(prev => {
              // Check if this reading already exists
              const exists = prev.some(r => 
                r.id === reading.id || 
                (r.timestamp === reading.timestamp && r.sensorId === reading.sensorId)
              );
              
              if (exists) {
                return prev;
              }
              
              // Add new reading and keep last 500 readings
              return [...prev, reading].slice(-500);
            });
            
            checkAlerts(reading);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsOnline(false);
      };
      
      ws.onclose = () => {
        console.log('❌ Disconnected from backend WebSocket');
        setIsOnline(false);
        ws = null;
        scheduleReconnect();
      };
    };
    
    const scheduleReconnect = () => {
      if (!isComponentMounted) return;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      
      console.log('🔄 Scheduling WebSocket reconnect in 3 seconds...');
      reconnectTimeout = setTimeout(() => {
        if (isComponentMounted) {
          connect();
        }
      }, 3000);
    };
    
    // Initial connection
    connect();
    
    // Cleanup on unmount
    return () => {
      isComponentMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on intentional close
        ws.close();
      }
    };
  }, []); // Empty dependency array - only run once

  // Fetch initial historical data from backend (all stored readings)
  useEffect(() => {
    const fetchHistoricalData = async () => {
      const apiUrl = `${backendUrl.http}/api/sensors/all?limit=2000`;
      console.log(`📡 Fetching historical data from: ${apiUrl}`);
      
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data: any[] = await res.json();
        console.log(`📊 Fetched ${data.length} historical readings from database`);
        
        if (data.length === 0) {
          console.log('ℹ️ No historical readings in database yet');
          return;
        }
        
        const readings: SensorData[] = data.map(d => ({
          id: d.id,
          sensorId: d.sensor_id || 1,
          moisture: d.moisture,
          temperature: d.temperature,
          humidity: d.humidity,
          ph: d.ph,
          timestamp: new Date(d.timestamp).getTime(),
          zone: d.zone
        }));
        
        // Sort by timestamp (oldest first for chart display)
        readings.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`📈 First reading: ${new Date(readings[0].timestamp).toLocaleString()}`);
        console.log(`📈 Last reading: ${new Date(readings[readings.length - 1].timestamp).toLocaleString()}`);
        
        // Set the historical data, merging with any WebSocket data
        setSensorHistory(prev => {
          if (prev.length === 0) {
            console.log(`✅ Loaded ${readings.length} historical readings into chart`);
            return readings;
          }
          
          // Merge: historical data + any new WebSocket data not in historical
          const historicalIds = new Set(readings.map(r => r.id));
          const newFromWs = prev.filter(r => r.id && !historicalIds.has(r.id));
          const merged = [...readings, ...newFromWs].sort((a, b) => a.timestamp - b.timestamp);
          console.log(`✅ Merged ${readings.length} historical + ${newFromWs.length} new = ${merged.length} total`);
          return merged.slice(-2000); // Keep last 2000 readings
        });
        
      } catch (err) {
        console.error('❌ Failed to fetch historical data:', err);
      }
    };
    
    // Fetch immediately and also after a short delay (in case backend is still starting)
    fetchHistoricalData();
    const retryTimeout = setTimeout(fetchHistoricalData, 2000);
    
    return () => clearTimeout(retryTimeout);

    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Load available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Close language menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the best voice for the selected language
  const getVoiceForLanguage = (lang: Language): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;
    
    // Language code mapping
    const langCodes: Record<Language, string[]> = {
      english: ['en-NG', 'en-GB', 'en-US', 'en'],
      pidgin: ['en-NG', 'en-GB', 'en'],  // Use English voice for Pidgin
      yoruba: ['yo', 'yo-NG', 'en-NG', 'en'],
      hausa: ['ha', 'ha-NG', 'en-NG', 'en'],
      igbo: ['ig', 'ig-NG', 'en-NG', 'en']
    };
    
    const codes = langCodes[lang];
    for (const code of codes) {
      const voice = availableVoices.find(v => v.lang.startsWith(code));
      if (voice) return voice;
    }
    return availableVoices[0]; // Fallback to first available voice
  };

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
      // Use refs to get current values (avoids stale closure)
      if (soundEnabledRef.current && !showLandingPageRef.current) {
        speakAlert('moisture_critical');
      }
    }
    
    if (data.temperature > 35) {
      newAlerts.push({
        id: Date.now().toString() + 't',
        type: 'temperature',
        message: 'High Temperature Warning.',
        timestamp: Date.now(),
        severity: 'warning'
      });
      // Use refs to get current values (avoids stale closure)
      if (soundEnabledRef.current && !showLandingPageRef.current) {
        speakAlert('temperature_high');
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  };

  // Speak an alert in the selected language
  const speakAlert = (alertKey: string) => {
    const translations = alertTranslations[alertKey];
    if (!translations) return;
    
    const text = translations[selectedLanguage] || translations.english;
    speak(text);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getVoiceForLanguage(selectedLanguage);
      if (voice) utterance.voice = voice;
      
      // Adjust rate for non-English to make it clearer
      if (selectedLanguage !== 'english') {
        utterance.rate = 0.9;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop any currently playing speech
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Toggle sound and stop any current speech when muting
  const toggleSound = () => {
    if (soundEnabled) {
      // When muting, stop any current speech
      stopSpeaking();
    }
    setSoundEnabled(!soundEnabled);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const renderContent = () => {
    // Get latest data for the selected sensor (or most recent if "all" is selected)
    const getLatestDataForSensor = () => {
      if (selectedSensorId === null) {
        // Return the most recent reading from any sensor
        return sensorHistory[sensorHistory.length - 1] || { 
          moisture: 0, 
          temperature: 0, 
          humidity: 0, 
          ph: 7.0, 
          timestamp: 0,
          sensorId: undefined
        };
      }
      
      // Filter readings for the selected sensor and get the latest one
      const sensorReadings = sensorHistory.filter(d => d.sensorId === selectedSensorId);
      return sensorReadings[sensorReadings.length - 1] || { 
        moisture: 0, 
        temperature: 0, 
        humidity: 0, 
        ph: 7.0, 
        timestamp: 0,
        sensorId: selectedSensorId
      };
    };
    
    const latestData = getLatestDataForSensor();

    switch (currentView) {
      case 'dashboard':
        return <DashboardHome 
          data={latestData} 
          history={sensorHistory} 
          alerts={alerts} 
          onViewChange={setCurrentView} 
          isDarkMode={isDarkMode}
          selectedSensorId={selectedSensorId}
          sensorStatuses={sensorStatuses}
        />;
      case 'soil':
        return <SoilMonitor 
          history={sensorHistory} 
          isDarkMode={isDarkMode}
          selectedSensorId={selectedSensorId}
          sensorStatuses={sensorStatuses}
        />;
      case 'health':
        return <LeafHealth />;
      case 'security':
        return <SecurityMonitor />;
      default:
        return <DashboardHome 
          data={latestData} 
          history={sensorHistory} 
          alerts={alerts} 
          onViewChange={setCurrentView} 
          isDarkMode={isDarkMode}
          selectedSensorId={selectedSensorId}
          sensorStatuses={sensorStatuses}
        />;
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
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-4 justify-center' : 'justify-between mb-4'}`}>
              <div className={`flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 ${isCollapsed ? 'justify-center' : ''}`}>
                {isOnline ? <Wifi className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <WifiOff className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                   {isOnline ? 'System Online' : 'Offline'}
                </span>
              </div>
              <div className="flex gap-2" ref={languageMenuRef}>
                {/* Language Selector */}
                <div className="relative">
                  <button 
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)} 
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" 
                    title={`Language: ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}`}
                  >
                    <Languages className="w-4 h-4 flex-shrink-0" />
                  </button>
                  
                  {/* Language Dropdown Menu */}
                  {showLanguageMenu && (
                    <div className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[150px] z-[100]"
                      style={{
                        bottom: '80px',
                        left: isCollapsed ? '70px' : '180px'
                      }}
                    >
                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                        Select Language
                      </div>
                      {[
                        { value: 'english', label: 'English', flag: '🇬🇧' },
                        { value: 'pidgin', label: 'Pidgin', flag: '🇳🇬' },
                        { value: 'yoruba', label: 'Yorùbá', flag: '🇳🇬' },
                        { value: 'hausa', label: 'Hausa', flag: '🇳🇬' },
                        { value: 'igbo', label: 'Igbo', flag: '🇳🇬' }
                      ].map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => {
                            setSelectedLanguage(lang.value as Language);
                            setShowLanguageMenu(false);
                            // Play a test sound in the new language
                            if (soundEnabled) {
                              const testPhrases: Record<Language, string> = {
                                english: 'Language changed to English',
                                pidgin: 'We don change am to Pidgin',
                                yoruba: 'A ti yí padà sí Yorùbá',
                                hausa: 'An canza zuwa Hausa',
                                igbo: 'Anyị gbanwere na Igbo'
                              };
                              speak(testPhrases[lang.value as Language]);
                            }
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                            selectedLanguage === lang.value 
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                          {selectedLanguage === lang.value && <span className="ml-auto text-emerald-500">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={toggleDarkMode} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="Toggle Theme">
                    {isDarkMode ? <Moon className="w-4 h-4 flex-shrink-0" /> : <Sun className="w-4 h-4 flex-shrink-0" />}
                </button>
                <button onClick={toggleSound} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title={soundEnabled ? "Mute" : "Unmute"}>
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
            
            {/* Sensor Selector Dropdown */}
            {(currentView === 'dashboard' || currentView === 'soil') && (
              <div className="ml-4 flex items-center gap-2">
                <select
                  value={selectedSensorId === null ? 'all' : selectedSensorId}
                  onChange={(e) => setSelectedSensorId(e.target.value === 'all' ? null : parseInt(e.target.value))}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                >
                  <option value="all">All Sensors (Average)</option>
                  {availableSensors.map(sensorId => {
                    const status = sensorStatuses[sensorId];
                    const isOnline = status?.online ?? false;
                    return (
                      <option key={sensorId} value={sensorId}>
                        Sensor #{sensorId} {isOnline ? '🟢' : '🔴'}
                      </option>
                    );
                  })}
                </select>
                {/* Show selected sensor status */}
                {selectedSensorId !== null && (
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                    sensorStatuses[selectedSensorId]?.online 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      sensorStatuses[selectedSensorId]?.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}></span>
                    {sensorStatuses[selectedSensorId]?.online ? 'Live' : 'Offline'}
                  </div>
                )}
              </div>
            )}
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