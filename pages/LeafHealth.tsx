import React, { useState, useRef } from 'react';
import { mockPlantImages } from '../services/mockData';
import { analyzePlantHealth } from '../services/geminiService';
import { Camera, Upload, RefreshCw, CheckCircle, AlertOctagon, Loader2 } from 'lucide-react';
import { PlantImage } from '../types';

const LeafHealth: React.FC = () => {
  const [images, setImages] = useState<PlantImage[]>(mockPlantImages);
  const [selectedImage, setSelectedImage] = useState<PlantImage>(mockPlantImages[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Result = reader.result as string;
        
        // Create temp image object
        const newImage: PlantImage = {
          id: Date.now().toString(),
          url: base64Result,
          timestamp: Date.now(),
          status: 'analyzing',
          analysis: 'Analyzing with Gemini AI...'
        };
        
        setImages([newImage, ...images]);
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
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leaf Health Analysis</h1>
          <p className="text-slate-500">Computer vision stress detection (Simulated with Gemini).</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
              <span>Upload Leaf</span>
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
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-medium text-slate-700">
                Capture Log
            </div>
            <div className="overflow-y-auto p-2 space-y-2 flex-1">
                {images.map(img => (
                    <div 
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex gap-3 ${
                            selectedImage.id === img.id 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-slate-200 hover:border-emerald-300'
                        }`}
                    >
                        <img src={img.url} alt="leaf" className="w-16 h-16 object-cover rounded-md bg-slate-200" />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-xs text-slate-500">
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
                                img.status === 'healthy' ? 'text-emerald-700' : 
                                img.status === 'analyzing' ? 'text-blue-600' : 'text-amber-700'
                            }`}>
                                {img.status.toUpperCase()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Viewer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden relative flex items-center justify-center mb-6 group">
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
                <h3 className="text-lg font-semibold text-slate-800">AI Diagnosis</h3>
                <div className={`p-4 rounded-lg border text-sm leading-relaxed ${
                     selectedImage.status === 'healthy' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                     selectedImage.status === 'analyzing' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                     'bg-amber-50 border-amber-100 text-amber-800'
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