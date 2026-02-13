import { AnswerResponse, Chapter, Citation, SourceMetadata, TranscriptSegment } from "../types";

type Provider = "openai" | "anthropic" | "gemini" | "ollama";

type TranscriptLoadApiResponse = {
  transcript: {
    transcript_id: string;
    source_label: string;
    source_title?: string | null;
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
  chapters: Array<{
    chapter_id: number;
    title: string;
    start_seconds: number;
    end_seconds: number;
    source: "youtube" | "generated";
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

type ChaptersApiResponse = {
  transcript_id: string;
  used_source: "youtube" | "generated";
  chapters: Array<{
    chapter_id: number;
    title: string;
    start_seconds: number;
    end_seconds: number;
    source: "youtube" | "generated";
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

function resolveApiBase(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const protocol = window.location.protocol;
  // Tauri packaged apps run under a non-http protocol. Local backend stays on localhost.
  if (protocol === "tauri:" || protocol === "asset:" || protocol === "file:") {
    return "http://127.0.0.1:8000";
  }

  return "";
}

const API_BASE = resolveApiBase();

let currentSourceContext: {
  source?: string;
  transcriptId?: string;
  sourceUrl?: string;
} = {};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, options);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;
  const fallbackText = !isJson ? await response.text() : "";

  if (!response.ok) {
    const detail =
      payload?.detail ||
      fallbackText ||
      `${response.status} ${response.statusText}`;
    throw new Error(detail);
  }

  if (!isJson || payload == null) {
    throw new Error(
      "Could not reach Capyap backend. If you are using the desktop app, start the local backend first with `capyap start`."
    );
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

function toChapters(items: Array<{
  chapter_id: number;
  title: string;
  start_seconds: number;
  end_seconds: number;
  source: "youtube" | "generated";
}>): Chapter[] {
  return items.map((chapter) => ({
    id: `chapter-${chapter.chapter_id}`,
    title: chapter.title,
    start: chapter.start_seconds,
    end: chapter.end_seconds,
    source: chapter.source,
  }));
}

function sourceTypeFromLabel(sourceLabel: string): "youtube" | "file" {
  return sourceLabel.startsWith("youtube:") ? "youtube" : "file";
}

function titleFromSource(
  source: string,
  sourceLabel: string,
  sourceTitle?: string | null,
): string {
  if (sourceTitle && sourceTitle.trim()) {
    return sourceTitle.trim();
  }

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

    if (!response?.transcript) {
      throw new Error("Transcript response was invalid. Please try again.");
    }

    currentSourceContext = {
      source: urlOrPath,
      transcriptId: response.transcript.transcript_id,
      sourceUrl: response.transcript.source_url || undefined,
    };

    return {
      id: response.transcript.transcript_id,
      title: titleFromSource(
        urlOrPath,
        response.transcript.source_label,
        response.transcript.source_title,
      ),
      sourceType: sourceTypeFromLabel(response.transcript.source_label),
      chunkCount: response.transcript.chunk_count,
      wordCount: response.transcript.total_words,
      url: response.transcript.source_url || urlOrPath,
      segments: toSegments(response.chunks || []),
      chapters: toChapters(response.chapters || []),
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

  generateChapters: async (
    apiKey: string,
    provider: Provider,
    model: string,
    maxChapters = 10
  ): Promise<Chapter[]> => {
    const defaults = providerDefaults[provider] || providerDefaults.openai;
    const resolvedModel = model && model !== "default" ? model : defaults.model;

    const response = await request<ChaptersApiResponse>("/api/agent/chapters", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        api_token: apiKey || undefined,
        provider,
        model: resolvedModel,
        base_url: defaults.baseUrl,
        transcript_id: currentSourceContext.transcriptId,
        source: currentSourceContext.source,
        max_chapters: maxChapters,
      }),
    });

    return toChapters(response.chapters || []);
  },
};
