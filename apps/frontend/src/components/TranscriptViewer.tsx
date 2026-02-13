import React, { useRef, useEffect } from 'react';
import { TranscriptSegment } from '../types';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  onSegmentClick: (start: number) => void;
  onOpenVideoAt?: (start: number) => void;
  activeSegmentId?: string;
  className?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ 
  segments, 
  onSegmentClick, 
  onOpenVideoAt,
  activeSegmentId,
  className = "" 
}) => {
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!activeSegmentId) return;
    const node = segmentRefs.current[activeSegmentId];
    if (node) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeSegmentId]);
  
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
          ref={(node) => { segmentRefs.current[seg.id] = node; }}
          onClick={() => onSegmentClick(seg.start)}
          title="Jump to this text segment"
          className={`
            p-2 rounded cursor-pointer transition-colors duration-200
            hover:bg-neutral-800/50 group flex gap-4 items-start
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
            flex-1
            text-sm leading-relaxed
            ${activeSegmentId === seg.id ? 'text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-300'}
          `}>
            {seg.text}
          </p>
          {onOpenVideoAt && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenVideoAt(seg.start);
              }}
              title="Open video at this timestamp"
              className="shrink-0 text-[10px] font-semibold text-primary-300 border border-primary-800/70 bg-primary-950/40 px-2 py-1 rounded hover:bg-primary-900/60 hover:text-primary-200 transition-colors"
            >
              Open
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
