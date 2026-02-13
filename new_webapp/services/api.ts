import { SourceMetadata, AnswerResponse, Citation, TranscriptSegment } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Generators
const generateSegments = (count: number): TranscriptSegment[] => {
  const segments: TranscriptSegment[] = [];
  let currentTime = 0;
  for (let i = 0; i < count; i++) {
    const duration = 5 + Math.random() * 10;
    segments.push({
      id: `seg-${i}`,
      start: currentTime,
      end: currentTime + duration,
      text: `This is a simulated transcript segment ${i + 1}. In a real application, this would contain the actual spoken words from the video timestamp ${Math.floor(currentTime)}s to ${Math.floor(currentTime + duration)}s. The local-first architecture ensures data privacy.`
    });
    currentTime += duration;
  }
  return segments;
};

const MOCK_CITATION: Citation = {
  chunkId: "seg-5",
  timestampStart: 45,
  timestampEnd: 52,
  excerpt: "The local-first architecture ensures data privacy."
};

export const api = {
  // POST /api/transcripts/load
  loadTranscript: async (urlOrPath: string): Promise<SourceMetadata> => {
    await delay(1200);
    
    // Simple validation simulation
    if (!urlOrPath.includes('.') && !urlOrPath.includes('youtube') && !urlOrPath.includes('youtu.be')) {
      throw new Error("Invalid URL or file path.");
    }

    const isYoutube = urlOrPath.includes('youtube') || urlOrPath.includes('youtu.be');
    
    return {
      id: "vid-" + Math.random().toString(36).substr(2, 9),
      title: isYoutube ? "Building Scalable Local AI Agents (2025 Guide)" : "Meeting_Notes_Architecture_Review.txt",
      sourceType: isYoutube ? 'youtube' : 'file',
      chunkCount: 142,
      wordCount: 12500,
      url: urlOrPath,
      segments: generateSegments(30)
    };
  },

  // POST /api/agent/ask
  // Requires apiKey passed in argument now, stateless
  askQuestion: async (question: string, apiKey: string, model: string): Promise<AnswerResponse> => {
    await delay(2000);
    if (!apiKey) throw new Error("API Key is required");
    
    return {
      text: "The transcript discusses the importance of local-first architecture. It specifically highlights that processing data on-device minimizes latency and ensures that sensitive research materials remain private, as opposed to cloud-based solutions.",
      citations: [MOCK_CITATION]
    };
  },

  // POST /api/agent/chat
  chat: async (message: string, history: any[], apiKey: string): Promise<AnswerResponse> => {
    await delay(1200);
    if (!apiKey) throw new Error("API Key is required");

    return {
      text: "Yes, exactly. The timestamp evidence provided earlier confirms that privacy is the main driver for this architectural choice.",
      citations: [MOCK_CITATION]
    };
  }
};