import React, { useState } from 'react';
import { mockMotionEvents } from '../services/mockData';
import { analyzeSecurityImage } from '../services/geminiService';
import { ShieldAlert, Eye, Clock, Loader2, Camera } from 'lucide-react';
import { MotionEvent } from '../types';

const SecurityMonitor: React.FC = () => {
  const [events, setEvents] = useState<MotionEvent[]>(mockMotionEvents);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Farm Security</h1>
           <p className="text-slate-500 dark:text-slate-400">Motion-triggered captures & intrusion detection.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            PIR Sensors Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img 
                        src={event.url} 
                        alt="Motion Event" 
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Motion
                    </div>
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-4 leading-relaxed">
                        {event.detectedObject || "Unknown Motion Detected"}
                    </p>
                    
                    <button 
                        onClick={() => handleAnalyze(event)}
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
        
        {/* Placeholder for empty state or more */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed flex flex-col items-center justify-center p-6 text-slate-400 dark:text-slate-500 gap-2 aspect-video md:aspect-auto">
            <Camera className="w-8 h-8 opacity-20" />
            <span className="text-sm">Waiting for motion...</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitor;