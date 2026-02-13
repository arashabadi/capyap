import React, { useState } from 'react';
import { Key, ShieldCheck, X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { SessionConfig } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: SessionConfig) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<SessionConfig['provider']>('gemini');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-100">
            <Key size={18} className="text-primary-500" />
            <span className="font-semibold">Unlock Intelligence</span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50 flex gap-3">
             <ShieldCheck className="text-green-500 flex-shrink-0" size={20} />
             <p className="text-xs text-neutral-400 leading-relaxed">
               Your API key is used directly for this session and is <strong>never stored</strong> on disk. 
               Capyap runs locally on your machine.
             </p>
          </div>

          <div className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Provider</label>
               <div className="grid grid-cols-2 gap-2">
                 {(['gemini', 'openai', 'anthropic', 'ollama'] as const).map(p => (
                   <button
                     key={p}
                     onClick={() => setProvider(p)}
                     className={`
                       px-3 py-2 text-sm rounded-md border transition-all capitalize
                       ${provider === p 
                         ? 'bg-neutral-800 border-primary-500 text-white' 
                         : 'bg-transparent border-neutral-800 text-neutral-500 hover:border-neutral-700'}
                     `}
                   >
                     {p}
                   </button>
                 ))}
               </div>
             </div>

             <Input
               label={`${provider} API Key`}
               type="password"
               placeholder="sk-..."
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
               autoFocus
             />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950/50 border-t border-neutral-800 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            disabled={!apiKey} 
            onClick={() => onSubmit({ apiKey, provider, model: 'default' })}
          >
            Start Analyzing
          </Button>
        </div>
      </div>
    </div>
  );
};