import React, { useState, useRef, useEffect } from 'react';
import { mockPlantImages } from '../services/mockData';
import { analyzePlantHealth } from '../services/geminiService';
import { Camera, Upload, RefreshCw, CheckCircle, AlertOctagon, Loader2, X } from 'lucide-react';
import { PlantImage } from '../types';

const LeafHealth: React.FC = () => {
  const [images, setImages] = useState<PlantImage[]>(mockPlantImages);
  const [selectedImage, setSelectedImage] = useState<PlantImage>(mockPlantImages[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Unified image processing logic
  const processImage = async (base64Result: string) => {
    // Create temp image object
    const newImage: PlantImage = {
      id: Date.now().toString(),
      url: base64Result,
      timestamp: Date.now(),
      status: 'analyzing',
      analysis: 'Analyzing with Gemini AI...'
    };
    
    setImages(prev => [newImage, ...prev]);
    setSelectedImage(newImage);
    setIsAnalyzing(true);

    // Remove header (data:image/jpeg;base64,) for API
    const base64Data = base64Result.split(',')[1];
    
    const analysisResult = await analyzePlantHealth(base64Data);
    
    // Update with result
    const updatedImage: PlantImage = {
        ...newImage,
        status: analysisResult.toLowerCase().includes('healthy') ? 'healthy' : 'stress',
        analysis: analysisResult
    };

    setImages(prev => prev.map(img => img.id === newImage.id ? updatedImage : img));
    setSelectedImage(updatedImage);
    setIsAnalyzing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            processImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Logic
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (isCameraOpen) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          setIsCameraOpen(false);
          alert("Could not access camera. Please ensure permissions are granted.");
        }
      }
    };

    if (isCameraOpen) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Result = canvas.toDataURL('image/jpeg');
        setIsCameraOpen(false); // This triggers useEffect cleanup (stopping camera)
        processImage(base64Result);
      }
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-auto"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-8">
                  <button 
                    onClick={() => setIsCameraOpen(false)}
                    className="p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors backdrop-blur-sm"
                  >
                      <X className="w-6 h-6" />
                  </button>
                  
                  <button 
                    onClick={capturePhoto}
                    className="p-1 rounded-full border-4 border-white/30 hover:border-white/50 transition-all"
                  >
                      <div className="w-14 h-14 rounded-full bg-emerald-500 hover:scale-90 transition-transform shadow-lg"></div>
                  </button>
                  
                  <div className="w-12"></div> {/* Spacer for centering */}
              </div>
           </div>
           <canvas ref={canvasRef} className="hidden" />
           <p className="text-slate-400 mt-4 text-sm">Ensure the leaf is well-lit and centered</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leaf Health Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400">Computer vision stress detection (Simulated with Gemini).</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Capture</span>
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
              <span>Upload Image</span>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Image List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[600px] transition-colors duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300">
                Capture Log
            </div>
            <div className="overflow-y-auto p-2 space-y-2 flex-1">
                {images.map(img => (
                    <div 
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex gap-3 ${
                            selectedImage.id === img.id 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/50' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}
                    >
                        <img src={img.url} alt="leaf" className="w-16 h-16 object-cover rounded-md bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(img.timestamp).toLocaleTimeString()}
                                </p>
                                {img.status === 'analyzing' ? (
                                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                                ) : img.status === 'healthy' ? (
                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                ) : (
                                    <AlertOctagon className="w-3 h-3 text-amber-500" />
                                )}
                            </div>
                            <p className={`text-sm font-medium truncate mt-1 ${
                                img.status === 'healthy' ? 'text-emerald-700 dark:text-emerald-400' : 
                                img.status === 'analyzing' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'
                            }`}>
                                {img.status.toUpperCase()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Viewer */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col transition-colors duration-300">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden relative flex items-center justify-center mb-6 group">
                <img 
                    src={selectedImage.url} 
                    alt="Selected Leaf" 
                    className="max-h-[400px] w-auto object-contain transition-transform duration-500" 
                />
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    ID: {selectedImage.id}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Diagnosis</h3>
                <div className={`p-4 rounded-lg border text-sm leading-relaxed ${
                     selectedImage.status === 'healthy' ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200' :
                     selectedImage.status === 'analyzing' ? 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200' :
                     'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200'
                }`}>
                    {selectedImage.status === 'analyzing' ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing image structures...
                        </div>
                    ) : (
                        selectedImage.analysis
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeafHealth;