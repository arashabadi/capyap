import React from 'react';
import { Citation } from '../types';
import { Play } from 'lucide-react';

interface CitationCardProps {
  citation: Citation;
  onJump?: (start: number) => void;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, onJump }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group flex flex-col p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:border-primary-500/30 hover:bg-neutral-900 transition-all cursor-default">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          Evidence
        </span>
        <button 
          onClick={() => onJump?.(citation.timestampStart)}
          title="Jump to this moment"
          className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400 bg-primary-950/50 border border-primary-900/50 px-2 py-1 rounded hover:bg-primary-900 hover:text-primary-300 transition-colors"
        >
          <Play size={8} className="fill-current" />
          {formatTime(citation.timestampStart)}
        </button>
      </div>
      <p className="text-sm text-neutral-400 leading-relaxed italic border-l-2 border-neutral-700 pl-3 group-hover:border-primary-500/50 transition-colors">
        "{citation.excerpt}"
      </p>
    </div>
  );
};
