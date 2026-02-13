import React, { useRef, useEffect } from 'react';
import { TranscriptSegment } from '../types';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  onSegmentClick: (start: number) => void;
  activeSegmentId?: string;
  className?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ 
  segments, 
  onSegmentClick, 
  activeSegmentId,
  className = "" 
}) => {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`overflow-y-auto ${className} space-y-1`}>
      {segments.map((seg) => (
        <div 
          key={seg.id}
          onClick={() => onSegmentClick(seg.start)}
          title="Jump to this moment"
          className={`
            p-2 rounded cursor-pointer transition-colors duration-200
            hover:bg-neutral-800/50 group flex gap-4
            ${activeSegmentId === seg.id ? 'bg-primary-900/20' : ''}
          `}
        >
          <span className={`
            flex-shrink-0 text-xs font-mono pt-1 select-none
            ${activeSegmentId === seg.id ? 'text-primary-400' : 'text-neutral-600 group-hover:text-neutral-500'}
          `}>
            {formatTime(seg.start)}
          </span>
          <p className={`
            text-sm leading-relaxed
            ${activeSegmentId === seg.id ? 'text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-300'}
          `}>
            {seg.text}
          </p>
        </div>
      ))}
    </div>
  );
};
