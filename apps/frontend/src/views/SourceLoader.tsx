import React, { useState, useRef, DragEvent } from 'react';
import { Youtube, FileText, ArrowRight, Command, UploadCloud, CheckCircle2, Link as LinkIcon, File } from 'lucide-react';
import { Button } from '../components/Button';
import { SourceMetadata } from '../types';
import { api } from '../services/api';
import { APP_VERSION } from '../version';

interface SourceLoaderProps {
  onSourceLoaded: (source: SourceMetadata) => void;
}

export const SourceLoader: React.FC<SourceLoaderProps> = ({ onSourceLoaded }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedType, setDetectedType] = useState<'url' | 'youtube' | 'file' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectType = (val: string) => {
    if (val.includes('youtube.com') || val.includes('youtu.be')) return 'youtube';
    if (val.match(/\.(txt|md|srt|vtt|json)$/i)) return 'file';
    if (val.startsWith('http')) return 'url';
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setDetectedType(detectType(val));
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInputValue(file.name);
      setDetectedType('file');
      setError(null);
      // In a real app, you would read the file content here
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setInputValue(file.name);
      setDetectedType('file');
      setError(null);
    }
  };

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const source = await api.loadTranscript(inputValue);
      onSourceLoaded(source);
    } catch (err: any) {
      setError(err.message || 'Failed to load source.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (detectedType) {
      case 'youtube': return <Youtube size={20} className="text-red-500" />;
      case 'file': return <FileText size={20} className="text-blue-500" />;
      case 'url': return <LinkIcon size={20} className="text-primary-500" />;
      default: return <Command size={20} className="text-neutral-500" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-neutral-950 to-neutral-900 font-sans">
      <div className="w-full max-w-xl animate-slide-up">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">Capyap</h1>
            <span className="text-xs px-2 py-1 rounded-full border border-neutral-700 text-neutral-300 bg-neutral-900/70 font-mono">
              {APP_VERSION}
            </span>
          </div>
          <p className="text-neutral-400 text-lg">Paste your YouTube link.</p>
        </div>

        {/* Main Card / Omnibox */}
        <div 
          className={`
            relative group rounded-2xl p-1.5 transition-all duration-300
            ${isDragging 
              ? 'bg-primary-500/20 ring-2 ring-primary-500 scale-105' 
              : 'bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 shadow-2xl'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <form onSubmit={handleLoad} className="relative bg-neutral-950 rounded-xl overflow-hidden flex items-center">
            
            {/* Left Icon Area */}
            <div className="pl-5 pr-3 text-neutral-400">
               {getIcon()}
            </div>

            {/* Unified Input */}
            <input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Paste YouTube URL or drop transcript file..."
              className="flex-1 bg-transparent border-none py-5 text-lg text-white placeholder:text-neutral-600 focus:ring-0 focus:outline-none"
              autoFocus
            />

            {/* Right Actions */}
            <div className="pr-2 flex items-center gap-2">
              <div className="h-8 w-[1px] bg-neutral-800 mx-2"></div>
              
              {/* File Upload Trigger */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".txt,.md,.srt,.vtt,.json"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                title="Upload File"
              >
                <UploadCloud size={20} />
              </button>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="!p-3 !rounded-lg" 
                variant="glow"
                isLoading={loading}
                disabled={!inputValue}
              >
                <ArrowRight size={20} />
              </Button>
            </div>

            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-neutral-900/95 flex items-center justify-center z-10 text-primary-400 font-medium text-lg border-2 border-dashed border-primary-500/50 rounded-xl">
                 <UploadCloud size={24} className="mr-3 animate-bounce" />
                 Drop transcript file here
              </div>
            )}
          </form>
        </div>

        {/* Helper Text / Formats */}
        <div className="mt-6 flex justify-center gap-6 text-xs text-neutral-500 font-medium">
           <span className="flex items-center gap-1.5 hover:text-neutral-300 transition-colors cursor-help" title="Supports standard YouTube links">
             <Youtube size={14} /> YouTube
           </span>
           <span className="flex items-center gap-1.5 hover:text-neutral-300 transition-colors cursor-help" title=".txt, .md, .srt, .vtt">
             <FileText size={14} /> .txt .md .srt
           </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 text-red-400 text-sm flex items-center justify-center gap-2 animate-fade-in">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            {error}
          </div>
        )}

        {/* Footer Features */}
        <div className="mt-20 grid grid-cols-3 gap-6 text-center opacity-60 hover:opacity-100 transition-opacity duration-500">
           <div className="space-y-1">
             <p className="text-sm font-semibold text-neutral-300">Local First</p>
             <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Zero Data Leak</p>
           </div>
           <div className="space-y-1">
             <p className="text-sm font-semibold text-neutral-300">Evidence Based</p>
             <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Timestamp Links</p>
           </div>
           <div className="space-y-1">
             <p className="text-sm font-semibold text-neutral-300">Secure Keys</p>
             <p className="text-[10px] text-neutral-500 uppercase tracking-wider">In-Memory Only</p>
           </div>
        </div>

      </div>
    </div>
  );
};
