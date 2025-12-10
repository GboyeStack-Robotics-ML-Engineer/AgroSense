import React, { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeSecurityImage } from '../services/geminiService';
import { ShieldAlert, Eye, Clock, Loader2, Camera, X, MapPin, Calendar, Share2, Download, Video, Radio, Play, Pause, RefreshCw } from 'lucide-react';
import { MotionEvent } from '../types';

// Get backend URL dynamically
const getBackendUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  return `http://${hostname}:8000`;
};

const backendUrl = getBackendUrl();

const SecurityMonitor: React.FC = () => {
  const [events, setEvents] = useState<MotionEvent[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'recorded' | 'live'>('recorded');
  const [isLoading, setIsLoading] = useState(true);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  
  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Preload images to avoid lag
  const preloadImage = useCallback((url: string) => {
    if (preloadedImages.has(url)) return;
    
    const img = new Image();
    img.onload = () => {
      setPreloadedImages(prev => new Set([...prev, url]));
    };
    img.src = url;
  }, [preloadedImages]);

  // Preload all event images
  useEffect(() => {
    events.forEach(event => {
      if (event.url) {
        preloadImage(event.url);
      }
    });
  }, [events, preloadImage]);

  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error fetching image for analysis:", error);
      return null;
    }
  };

  const handleAnalyze = async (event: MotionEvent) => {
    setAnalyzingId(event.id);
    
    try {
      let base64Data: string | null = null;

      if (event.url.startsWith('data:image')) {
          base64Data = event.url.split(',')[1];
      } else {
          base64Data = await fetchImageAsBase64(event.url);
      }

      if (!base64Data) {
          const updatedEvents = events.map(e => 
              e.id === event.id ? { ...e, detectedObject: "Error: Could not access image for analysis." } : e
          );
          setEvents(updatedEvents);
          return;
      }

      const analysis = await analyzeSecurityImage(base64Data);

      const updatedEvents = events.map(e => 
          e.id === event.id ? { ...e, detectedObject: analysis } : e
      );
      setEvents(updatedEvents);
      
    } catch (error) {
      console.error("Analysis process failed:", error);
      const updatedEvents = events.map(e => 
        e.id === event.id ? { ...e, detectedObject: "Error analyzing image." } : e
      );
      setEvents(updatedEvents);
    } finally {
      setAnalyzingId(null);
    }
  };


  // Fetch security alerts from backend API
  const fetchSecurityAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${backendUrl}/api/camera/alerts?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch security alerts');
      
      const data = await response.json();
      const alerts = data.alerts || [];
      
      // Convert backend alerts to MotionEvent format
      const motionEvents: MotionEvent[] = alerts.map((alert: any) => ({
        id: alert.id,
        timestamp: new Date(alert.timestamp).getTime(),
        detectedObject: alert.detectedObject || "Intruder Detected",
        url: alert.image_data ? `data:image/jpeg;base64,${alert.image_data}` : '',
        videoUrl: alert.video_filename 
          ? `${backendUrl}/api/camera/videos/${alert.video_filename}`
          : undefined
      }));
      
      setEvents(motionEvents);
      
      // Preload all images
      motionEvents.forEach(event => {
        if (event.url) {
          const img = new Image();
          img.src = event.url;
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load security alerts on mount
  useEffect(() => {
    fetchSecurityAlerts();
  }, [fetchSecurityAlerts]);

  // WebSocket Connection for real-time security alerts
  useEffect(() => {
    const wsUrl = `${backendUrl.replace('http', 'ws')}/ws/sensor-data`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('Connected to Security Stream');

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);

            // Handle security_alert type messages
            if (message.type === 'security_alert') {
                const alertData = message.data;

                // Convert backend payload to Frontend MotionEvent type
                const newEvent: MotionEvent = {
                    id: alertData.id,
                    timestamp: new Date(alertData.timestamp).getTime(),
                    detectedObject: alertData.detectedObject || "Intruder Detected",
                    // Construct the Base64 image string for the <img> tag
                    url: `data:image/jpeg;base64,${alertData.image_data}`,
                    // Add video URL if available
                    videoUrl: alertData.video_filename 
                      ? `${backendUrl}/api/camera/videos/${alertData.video_filename}`
                      : undefined
                };

                // Preload the image immediately
                if (newEvent.url) {
                  const img = new Image();
                  img.src = newEvent.url;
                }

                // Add to the TOP of the list (newest first)
                setEvents((prev) => [newEvent, ...prev]);
            }
            
        } catch (error) {
            // Ignore ping/pong messages
        }
    };

    return () => {
        if (ws.readyState === 1) ws.close();
    };
  }, []);

  // Live Video Feed Component
  const LiveVideoFeed: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(true);
    const imgRef = useRef<HTMLImageElement>(null);

    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {/* Live badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          LIVE
        </div>
        
        {isPlaying ? (
          <img 
            ref={imgRef}
            src={`${backendUrl}/video_feed`}
            alt="Live Camera Feed"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/60">
            <Camera className="w-16 h-16 mb-4" />
            <span>Feed Paused</span>
          </div>
        )}
        
        {/* Play/Pause control */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>
    );
  };

  // Recorded Video Component
  const RecordedVideo: React.FC<{ event: MotionEvent }> = ({ event }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasVideo, setHasVideo] = useState(!!event.videoUrl);
    const [isLoading, setIsLoading] = useState(true);
    const [videoError, setVideoError] = useState<string | null>(null);

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      const error = video.error;
      console.error('Video playback error:', error);
      setVideoError(error?.message || 'Failed to load video');
      setHasVideo(false);
      setIsLoading(false);
    };

    const handleVideoLoaded = () => {
      setIsLoading(false);
      setVideoError(null);
    };

    if (!hasVideo || !event.videoUrl) {
      // Show static image if no video available
      return (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {/* Recorded badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-lg">
            <Camera className="w-4 h-4" />
            SNAPSHOT
          </div>
          
          {videoError && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-red-600/80 text-white px-3 py-1.5 rounded-md text-xs">
              Video unavailable
            </div>
          )}
          
          <img 
            src={event.url} 
            alt="Detection Frame" 
            className="max-w-full max-h-full object-contain" 
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {/* Recorded badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-lg">
          <Video className="w-4 h-4" />
          RECORDED (10s)
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              <span className="text-white text-sm">Loading video...</span>
            </div>
          </div>
        )}
        
        <video 
          ref={videoRef}
          src={event.videoUrl}
          className="max-w-full max-h-full object-contain"
          controls
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleVideoError}
          onLoadedData={handleVideoLoaded}
          onCanPlay={handleVideoLoaded}
        />
        
        {/* Large play button overlay when paused and loaded */}
        {!isPlaying && !isLoading && (
          <button 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
              <Play className="w-10 h-10 text-slate-900 ml-1" />
            </div>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Farm Security</h1>
           <p className="text-slate-500 dark:text-slate-400">Motion-triggered captures & intrusion detection.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSecurityAlerts}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              PIR Sensors Active
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-slate-500">Loading security events...</span>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Camera className="w-16 h-16 mb-4 opacity-30" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No Security Events</h3>
          <p className="text-sm text-center max-w-md">
            No intrusions have been detected yet. When the camera detects motion or an intruder, events will appear here.
          </p>
        </div>
      )}

      {!isLoading && events.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col">
                <div 
                  className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setViewMode('recorded'); // Default to recorded view
                  }}
                >
                    <img 
                        src={event.url} 
                        alt="Motion Event" 
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="eager"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">Click to View</span>
                    </div>
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="w-3 h-3" /> Motion
                    </div>
                    {/* Video indicator */}
                    {event.videoUrl && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video
                      </div>
                    )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-4 leading-relaxed flex-1 line-clamp-2">
                        {event.detectedObject || "Unknown Motion Detected"}
                    </p>
                    
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze(event);
                        }}
                        disabled={analyzingId === event.id}
                        className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        {analyzingId === event.id ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" /> AI Enhanced Inspect
                            </>
                        )}
                    </button>
                </div>
            </div>
        ))}
        
        {/* Placeholder */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed flex flex-col items-center justify-center p-6 text-slate-400 dark:text-slate-500 gap-2 aspect-video md:aspect-auto min-h-[280px]">
            <Camera className="w-8 h-8 opacity-20" />
            <span className="text-sm">Waiting for motion...</span>
        </div>
      </div>
      )}

      {/* Detail Modal Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-200 relative">
            
            {/* Close Button (Mobile fixed) */}
            <button 
              onClick={() => setSelectedEventId(null)}
              className="lg:hidden absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Section: Footage */}
            <div className="lg:w-2/3 bg-black relative flex items-center justify-center h-1/2 lg:h-full">
              {viewMode === 'live' ? (
                <LiveVideoFeed />
              ) : (
                <RecordedVideo event={selectedEvent} />
              )}
            </div>

            {/* Right Section: Details */}
            <div className="lg:w-1/3 h-1/2 lg:h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
               
               {/* Header */}
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                 <div>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security Event</h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400">ID: {selectedEvent.id.toString().toUpperCase()}</p>
                 </div>
                 <button 
                    onClick={() => setSelectedEventId(null)}
                    className="hidden lg:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                 >
                    <X className="w-6 h-6" />
                 </button>
               </div>

               {/* View Mode Toggle */}
               <div className="px-6 pt-4">
                 <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                   <button
                     onClick={() => setViewMode('recorded')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                       viewMode === 'recorded' 
                         ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                         : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                     }`}
                   >
                     <Video className="w-4 h-4" />
                     Recorded
                   </button>
                   <button
                     onClick={() => setViewMode('live')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                       viewMode === 'live' 
                         ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                         : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                     }`}
                   >
                     <Radio className="w-4 h-4" />
                     Live Feed
                   </button>
                 </div>
               </div>

               {/* Scrollable Content */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Metadata */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                       <Calendar className="w-4 h-4 text-slate-400" />
                       <span className="text-sm font-medium">{new Date(selectedEvent.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-sm font-medium">{new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                       <MapPin className="w-4 h-4 text-slate-400" />
                       <span className="text-sm font-medium">Sector 4 (North Perimeter)</span>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* Analysis Result */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">AI Analysis Report</h3>
                    <div className={`p-4 rounded-lg text-sm leading-relaxed ${
                      selectedEvent.detectedObject?.includes("Animal") 
                        ? "bg-amber-50 border border-amber-100 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100"
                        : "bg-slate-50 border border-slate-100 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300"
                    }`}>
                       {selectedEvent.detectedObject || "No automated analysis performed yet."}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors">
                       <Share2 className="w-4 h-4" /> Share Report
                    </button>
                     <button className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors">
                       <Download className="w-4 h-4" /> Export Frame
                    </button>
                  </div>
               </div>

               {/* Footer Action */}
               <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                   <button 
                      onClick={() => handleAnalyze(selectedEvent)}
                      disabled={analyzingId === selectedEvent.id}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                      {analyzingId === selectedEvent.id ? (
                          <>
                              <Loader2 className="w-5 h-5 animate-spin" /> Processing with Gemini...
                          </>
                      ) : (
                          <>
                              <Eye className="w-5 h-5" /> Run Deep Inspection
                          </>
                      )}
                   </button>
               </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMonitor;