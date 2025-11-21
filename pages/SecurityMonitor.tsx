import React, { useState, useRef } from 'react';
import { mockMotionEvents } from '../services/mockData';
import { analyzeSecurityImage } from '../services/geminiService';
import { ShieldAlert, Eye, Clock, Loader2, Camera } from 'lucide-react';
import { MotionEvent } from '../types';

const SecurityMonitor: React.FC = () => {
  const [events, setEvents] = useState<MotionEvent[]>(mockMotionEvents);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Function to simulate analyzing an existing event with Gemini
  const handleAnalyze = async (event: MotionEvent) => {
    setAnalyzingId(event.id);
    // Fetch the image convert to base64 (simulated here since we use external URLs, we'll skip actual fetch for demo and assume we send the URL or placeholder)
    // NOTE: For this web demo, we can't easily fetch cross-origin images to base64 without proxy. 
    // We will simulate the AI response delay and return a mock "Smart" response or use a placeholder base64 if user uploaded.
    
    // However, to make it functional if user uploads:
    // Real implementation would send `event.url` if public, or base64.
    
    // Let's simulate a detailed analysis for the demo data:
    await new Promise(r => setTimeout(r, 1500)); // Fake network delay
    
    const analysis = event.detectedObject?.includes('Dog') 
        ? "AI Analysis: Identified domestic canine (Dog). No immediate threat to crops, but may dig. Recommendation: Activate ultrasonic repeller."
        : "AI Analysis: Motion detected. Object unclear but low threat probability.";

    // Update the event with new "AI Enhanced" details
    const updatedEvents = events.map(e => 
        e.id === event.id ? { ...e, detectedObject: analysis } : e
    );
    setEvents(updatedEvents);
    setAnalyzingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Farm Security</h1>
           <p className="text-slate-500">Motion-triggered captures & intrusion detection.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            PIR Sensors Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img 
                        src={event.url} 
                        alt="Motion Event" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Motion
                    </div>
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-800 font-medium mb-4">
                        {event.detectedObject || "Unknown Motion Detected"}
                    </p>
                    
                    <button 
                        onClick={() => handleAnalyze(event)}
                        disabled={analyzingId === event.id}
                        className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-colors"
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
        <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-6 text-slate-400 gap-2 aspect-video md:aspect-auto">
            <Camera className="w-8 h-8 opacity-20" />
            <span className="text-sm">Waiting for motion...</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitor;