import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Key, RefreshCcw, ShieldCheck, X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { SessionConfig } from '../types';
import { api, OllamaStatus } from '../services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: SessionConfig) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<SessionConfig['provider']>('gemini');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [ollamaStatusError, setOllamaStatusError] = useState<string | null>(null);
  const providerKeyMeta: Record<SessionConfig['provider'], { placeholder: string; hint: string }> = {
    gemini: {
      placeholder: 'AIza...',
      hint: 'Gemini API keys usually start with AIza.',
    },
    openai: {
      placeholder: 'sk-proj-... (or sk-...)',
      hint: 'OpenAI API keys start with sk-.',
    },
    anthropic: {
      placeholder: 'sk-ant-...',
      hint: 'Anthropic API keys start with sk-ant-.',
    },
    ollama: {
      placeholder: 'No key required for local Ollama',
      hint: 'Capyap checks your local Ollama server and models automatically.',
    },
  };
  const requiresApiKey = provider !== 'ollama';
  const keyMeta = providerKeyMeta[provider];
  const recommendedModel = ollamaStatus?.recommended_model || 'llama3.1';
  const ollamaReady = provider !== 'ollama' || Boolean(ollamaStatus?.reachable && ollamaStatus?.has_models);

  const checkOllamaStatus = async () => {
    setCheckingOllama(true);
    setOllamaStatusError(null);
    try {
      const status = await api.getOllamaStatus('http://127.0.0.1:11434/v1');
      setOllamaStatus(status);
    } catch (err: any) {
      setOllamaStatus(null);
      setOllamaStatusError(err?.message || 'Could not check local Ollama status.');
    } finally {
      setCheckingOllama(false);
    }
  };

  useEffect(() => {
    if (!isOpen || provider !== 'ollama') return;
    void checkOllamaStatus();
  }, [isOpen, provider]);

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

             {requiresApiKey ? (
               <>
                 <Input
                   label={`${provider} API Key`}
                   type="password"
                   placeholder={keyMeta.placeholder}
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
                 autoFocus
                />
                 <p className="text-xs text-neutral-500 -mt-1">{keyMeta.hint}</p>
               </>
             ) : (
               <div className="space-y-3 text-xs">
                 <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                   <div className="flex items-start gap-2">
                     {ollamaReady ? (
                       <CheckCircle2 size={16} className="text-green-400 mt-0.5" />
                     ) : (
                       <AlertTriangle size={16} className="text-amber-400 mt-0.5" />
                     )}
                     <div className="space-y-1">
                       <p className="text-neutral-200 font-medium">Local Ollama Status</p>
                       <p className="text-neutral-400">
                         {checkingOllama
                           ? 'Checking local Ollama server...'
                           : ollamaStatus?.message || ollamaStatusError || 'Click re-check to verify local Ollama.'}
                       </p>
                       {ollamaStatus?.version && (
                         <p className="text-neutral-500">Version: {ollamaStatus.version}</p>
                       )}
                       {ollamaStatus?.models?.length ? (
                         <p className="text-neutral-500">
                           Models: {ollamaStatus.models.slice(0, 3).join(', ')}
                           {ollamaStatus.models.length > 3 ? ` (+${ollamaStatus.models.length - 3} more)` : ''}
                         </p>
                       ) : null}
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center justify-between">
                   <a
                     href={ollamaStatus?.install_url || 'https://ollama.com/download'}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-primary-400 hover:text-primary-300 underline"
                   >
                     Install Ollama
                   </a>
                   <Button
                     type="button"
                     size="sm"
                     variant="ghost"
                     onClick={() => void checkOllamaStatus()}
                     isLoading={checkingOllama}
                     icon={<RefreshCcw size={14} />}
                   >
                     Re-check
                   </Button>
                 </div>

                 {!ollamaReady && (
                   <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-neutral-400 space-y-2">
                     <p className="text-neutral-300 font-medium">First-time local setup</p>
                     <p>1. Install Ollama from the link above.</p>
                     <p>
                       2. In Terminal run <code className="font-mono text-primary-300">ollama serve</code> if it is not already running.
                     </p>
                     <p>
                       3. Pull a model: <code className="font-mono text-primary-300">ollama pull {recommendedModel}</code>
                     </p>
                     <p>
                       4. Keep Ollama running, then click <strong>Re-check</strong> and continue.
                     </p>
                     <p className="text-neutral-500">
                       Capyap should be running locally (example: <code className="font-mono">capyap start</code>).
                     </p>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950/50 border-t border-neutral-800 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            disabled={requiresApiKey ? !apiKey.trim() : !ollamaReady}
            onClick={() =>
              onSubmit({
                apiKey: provider === 'ollama' ? 'ollama-local' : apiKey.trim(),
                provider,
                model: provider === 'ollama'
                  ? (ollamaStatus?.models?.[0] || recommendedModel)
                  : 'default',
              })
            }
          >
            Start Analyzing
          </Button>
        </div>
      </div>
    </div>
  );
};
