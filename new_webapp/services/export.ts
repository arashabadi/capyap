import { SourceMetadata } from '../types';

export const downloadTranscript = (source: SourceMetadata, format: 'txt' | 'txt-timestamps' | 'json') => {
  let content = '';
  let mimeType = 'text/plain';
  let extension = 'txt';

  switch (format) {
    case 'json':
      content = JSON.stringify(source, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'txt-timestamps':
      content = source.segments
        .map(s => `[${formatTime(s.start)}] ${s.text}`)
        .join('\n');
      break;
    case 'txt':
    default:
      content = source.segments
        .map(s => s.text)
        .join('\n');
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${source.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};