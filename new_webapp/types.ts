export enum AppView {
  SOURCE_LOADER = 'SOURCE_LOADER',
  TRANSCRIPT_VIEW = 'TRANSCRIPT_VIEW'
}

// Minimal settings, mostly just for the active session
export interface SessionConfig {
  apiKey?: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  model: string;
}

export interface Citation {
  chunkId: string;
  timestampStart: number;
  timestampEnd: number;
  excerpt: string;
}

export interface AnswerResponse {
  text: string;
  citations: Citation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: number;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface SourceMetadata {
  id: string;
  title: string;
  sourceType: 'youtube' | 'file';
  chunkCount: number;
  wordCount: number;
  url?: string;
  segments: TranscriptSegment[]; // Full transcript available immediately
}

export interface ApiError {
  message: string;
}