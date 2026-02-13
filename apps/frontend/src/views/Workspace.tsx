import React, { useState } from 'react';
import { ArrowLeft, Sparkles, X, Send, Search, Download, ChevronDown, FileJson, FileText, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { CitationCard } from '../components/CitationCard';
import { ApiKeyModal } from '../components/ApiKeyModal';
import { SourceMetadata, SessionConfig, ChatMessage } from '../types';
import { api } from '../services/api';
import { downloadTranscript } from '../services/export';

interface WorkspaceProps {
  source: SourceMetadata;
  onBack: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ source, onBack }) => {
  // Session State
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  // UI State
  const [activeSegmentId, setActiveSegmentId] = useState<string | undefined>();
  const [query, setQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Handlers
  const handleSegmentClick = (start: number) => {
    const seg = source.segments.find(s => s.start === start);
    if(seg) setActiveSegmentId(seg.id);
  };

  const handleOpenQA = () => {
    if (!sessionConfig) {
      setShowKeyModal(true);
    } else {
      setIsPanelOpen(true);
    }
  };

  const handleKeySubmit = (config: SessionConfig) => {
    setSessionConfig(config);
    setShowKeyModal(false);
    setIsPanelOpen(true);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !sessionConfig?.apiKey) return;

    setLoading(true);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery('');

    try {
      const historyForApi = [
        ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user' as const, content: userMsg.content },
      ];
      const response = await api.askQuestion(
        userMsg.content,
        sessionConfig.apiKey,
        sessionConfig.model,
        sessionConfig.provider,
        historyForApi,
      );
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        citations: response.citations,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error connecting to the API. Please check your key and try again.",
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 overflow-hidden text-neutral-200">
      
      {/* LEFT: Transcript View */}
      <div className={`flex-1 flex flex-col border-r border-neutral-900 transition-all duration-300 ${isPanelOpen ? 'w-2/3' : 'w-full'}`}>
        
        {/* Header */}
        <header className="h-20 border-b border-neutral-900 flex items-center justify-between px-6 bg-neutral-950/50 backdrop-blur z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2 -ml-2 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-full transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-white truncate max-w-sm">{source.title}</h1>
              <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                <span className="uppercase tracking-wider font-mono">{source.sourceType}</span>
                <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
                <span>{source.wordCount.toLocaleString()} words</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Export Dropdown */}
             <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-neutral-400 hover:text-white"
                  icon={<Download size={16} />}
                >
                  Export
                  <ChevronDown size={14} className={`ml-1 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </Button>
                
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in">
                      <div className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-950/50 border-b border-neutral-800">
                        Download Format
                      </div>
                      <button onClick={() => downloadTranscript(source, 'txt')} className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-3 transition-colors">
                        <FileText size={16} className="text-neutral-500" />
                        <span>Clean Text (.txt)</span>
                      </button>
                      <button onClick={() => downloadTranscript(source, 'txt-timestamps')} className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-3 transition-colors">
                        <Clock size={16} className="text-neutral-500" />
                        <span>With Timestamps (.txt)</span>
                      </button>
                      <button onClick={() => downloadTranscript(source, 'json')} className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-3 transition-colors">
                        <FileJson size={16} className="text-neutral-500" />
                        <span>Raw JSON (.json)</span>
                      </button>
                    </div>
                  </>
                )}
             </div>

             {/* Primary AI CTA (visible when panel closed) */}
             {!isPanelOpen && (
               <Button 
                 variant="glow" 
                 size="md" 
                 onClick={handleOpenQA}
                 className="shadow-xl shadow-primary-900/10 px-6"
                 icon={<Sparkles size={16} />}
               >
                 Start AI Analysis
               </Button>
             )}
          </div>
        </header>

        {/* Transcript Content */}
        <div className="flex-1 overflow-hidden p-2 bg-neutral-950/30">
           <TranscriptViewer 
             segments={source.segments} 
             onSegmentClick={handleSegmentClick}
             activeSegmentId={activeSegmentId}
             className="h-full px-4 scrollbar-hide max-w-4xl mx-auto"
           />
        </div>
      </div>

      {/* RIGHT: Q/A Panel */}
      {isPanelOpen && (
        <div className="w-[450px] bg-neutral-900 flex flex-col shadow-2xl animate-slide-up border-l border-neutral-800 z-30">
           
           {/* Panel Header */}
           <div className="h-20 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900">
              <div className="flex flex-col">
                <span className="font-semibold text-white flex items-center gap-2 text-lg">
                  <Sparkles size={18} className="text-primary-500" />
                  AI Agent
                </span>
                <span className="text-xs text-neutral-500">Ask questions, get cited answers.</span>
              </div>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
           </div>

           {/* Chat Area */}
           <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 px-6">
                   <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-6 border border-neutral-800">
                      <Search size={32} className="text-primary-400" />
                   </div>
                   <h3 className="text-lg font-medium text-white mb-2">What can I do?</h3>
                   <ul className="text-sm text-neutral-400 space-y-3 text-left w-full max-w-xs mx-auto mt-2">
                      <li className="flex gap-2">
                        <span className="text-primary-500">•</span> Summarize key takeaways
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary-500">•</span> Find specific timestamps for topics
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary-500">•</span> Generate study notes or quizzes
                      </li>
                   </ul>
                </div>
              )}
              
              {chatHistory.map(msg => (
                <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className={`
                     max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                     ${msg.role === 'user' 
                       ? 'bg-neutral-800 text-white rounded-tr-sm border border-neutral-700' 
                       : 'bg-transparent text-neutral-300 pl-0'}
                   `}>
                     {msg.content}
                   </div>
                   {msg.citations && (
                     <div className="w-full space-y-2 pl-0 animate-fade-in">
                       {msg.citations.map((c, i) => (
                         <CitationCard 
                           key={i} 
                           citation={c} 
                           onJump={handleSegmentClick} 
                         />
                       ))}
                     </div>
                   )}
                </div>
              ))}
              
              {loading && (
                 <div className="flex gap-1 pl-1 py-2">
                   <div className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce" />
                   <div className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce [animation-delay:0.1s]" />
                   <div className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                 </div>
              )}
           </div>

           {/* Input Area */}
           <div className="p-5 border-t border-neutral-800 bg-neutral-900">
              <form onSubmit={handleAsk} className="relative group">
                <input
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-4 pr-12 py-4 text-sm text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-neutral-600 shadow-inner"
                  placeholder="Ask a question about this transcript..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-neutral-800 hover:bg-primary-600 text-neutral-400 hover:text-white rounded-lg transition-all disabled:opacity-0 disabled:scale-75"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                 <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                    {sessionConfig?.provider.toUpperCase() || 'CONNECTED'}
                 </span>
                 <span>Local Session</span>
              </div>
           </div>
        </div>
      )}

      <ApiKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)}
        onSubmit={handleKeySubmit}
      />

    </div>
  );
};
