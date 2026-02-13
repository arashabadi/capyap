import { AnswerResponse, Citation, SourceMetadata, TranscriptSegment } from "../types";

type Provider = "openai" | "anthropic" | "gemini" | "ollama";

type TranscriptLoadApiResponse = {
  transcript: {
    transcript_id: string;
    source_label: string;
    source_url?: string | null;
    chunk_count: number;
    total_words: number;
  };
  chunks: Array<{
    chunk_id: number;
    text: string;
    start_seconds: number;
    end_seconds: number;
    start_label: string;
    end_label: string;
  }>;
};

type AskApiResponse = {
  answer: string;
  transcript_id: string;
  source_label: string;
  source_url?: string | null;
  citations: Array<{
    chunk_id: number;
    start_seconds: number;
    end_seconds: number;
    text: string;
  }>;
};

const providerDefaults: Record<Provider, { baseUrl: string; model: string }> = {
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  anthropic: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-sonnet",
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
  },
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

let currentSourceContext: {
  source?: string;
  transcriptId?: string;
  sourceUrl?: string;
} = {};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, options);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const detail = payload?.detail || `${response.status} ${response.statusText}`;
    throw new Error(detail);
  }

  return payload as T;
}

function toSegments(chunks: TranscriptLoadApiResponse["chunks"]): TranscriptSegment[] {
  return chunks.map((chunk) => ({
    id: `seg-${chunk.chunk_id}`,
    start: chunk.start_seconds,
    end: chunk.end_seconds,
    text: chunk.text,
  }));
}

function toCitations(items: AskApiResponse["citations"]): Citation[] {
  return items.map((citation) => ({
    chunkId: `seg-${citation.chunk_id}`,
    timestampStart: citation.start_seconds,
    timestampEnd: citation.end_seconds,
    excerpt: citation.text,
  }));
}

function sourceTypeFromLabel(sourceLabel: string): "youtube" | "file" {
  return sourceLabel.startsWith("youtube:") ? "youtube" : "file";
}

function titleFromSource(source: string, sourceLabel: string): string {
  if (sourceLabel.startsWith("youtube:")) {
    return `YouTube Transcript (${sourceLabel.replace("youtube:", "")})`;
  }

  const clean = source.split(/[\\/]/).pop() || source;
  return clean;
}

export const api = {
  loadTranscript: async (urlOrPath: string): Promise<SourceMetadata> => {
    const response = await request<TranscriptLoadApiResponse>("/api/transcripts/load", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ source: urlOrPath }),
    });

    currentSourceContext = {
      source: urlOrPath,
      transcriptId: response.transcript.transcript_id,
      sourceUrl: response.transcript.source_url || undefined,
    };

    return {
      id: response.transcript.transcript_id,
      title: titleFromSource(urlOrPath, response.transcript.source_label),
      sourceType: sourceTypeFromLabel(response.transcript.source_label),
      chunkCount: response.transcript.chunk_count,
      wordCount: response.transcript.total_words,
      url: response.transcript.source_url || urlOrPath,
      segments: toSegments(response.chunks || []),
    };
  },

  askQuestion: async (
    question: string,
    apiKey: string,
    model: string,
    provider: Provider,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<AnswerResponse> => {
    if (!apiKey) {
      throw new Error("API Key is required");
    }

    const defaults = providerDefaults[provider] || providerDefaults.openai;
    const resolvedModel = model && model !== "default" ? model : defaults.model;

    const response = await request<AskApiResponse>("/api/agent/chat", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        question,
        api_token: apiKey,
        provider,
        model: resolvedModel,
        base_url: defaults.baseUrl,
        transcript_id: currentSourceContext.transcriptId,
        source: currentSourceContext.source,
        history,
      }),
    });

    return {
      text: response.answer,
      citations: toCitations(response.citations || []),
    };
  },

  chat: async (
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    apiKey: string,
    provider: Provider,
    model: string
  ): Promise<AnswerResponse> => {
    return api.askQuestion(message, apiKey, model, provider, history);
  },
};
