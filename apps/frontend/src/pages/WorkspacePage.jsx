import { useMemo, useState } from "react";
import { askAgent, loadTranscript } from "../services/api";
import AgentPopup from "../components/AgentPopup";
import CitationList from "../components/CitationList";

export default function WorkspacePage() {
  const [source, setSource] = useState("");
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sourceUrl = useMemo(() => transcript?.source_url || null, [transcript]);

  async function handleLoadTranscript(event) {
    event.preventDefault();
    if (!source.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await loadTranscript({ source: source.trim() });
      setTranscript(response.transcript);
    } catch (err) {
      setError(err.message || "Unable to load transcript");
    } finally {
      setBusy(false);
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await askAgent({
        question: question.trim(),
        source: source.trim(),
        transcript_id: transcript?.transcript_id,
      });
      setAnswer(response.answer);
      setCitations(response.citations || []);
      if (!transcript) {
        setTranscript({
          transcript_id: response.transcript_id,
          source_label: response.source_label,
          source_url: response.source_url,
          chunk_count: 0,
          total_words: 0,
        });
      }
    } catch (err) {
      setError(err.message || "Unable to get answer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="workspace">
      <section className="panel">
        <h1>Capyap Local Agent</h1>
        <p>Paste a YouTube URL (or local transcript path), then ask questions with timestamp citations.</p>

        <form onSubmit={handleLoadTranscript} className="form-row">
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="https://youtu.be/... or /path/to/transcript.txt"
          />
          <button type="submit" disabled={busy || !source.trim()}>
            {busy ? "Loading..." : "Load Transcript"}
          </button>
        </form>

        {transcript ? (
          <p className="meta">
            Loaded: <code>{transcript.source_label}</code>
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Ask Anything</h2>
        <form onSubmit={handleAsk} className="form-col">
          <textarea
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What are the main arguments and where are they discussed?"
          />
          <button type="submit" disabled={busy || !source.trim()}>
            {busy ? "Thinking..." : "Ask Agent"}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}

        {answer ? (
          <article className="answer-card">
            <h3>Answer</h3>
            <p>{answer}</p>
            <CitationList sourceUrl={sourceUrl} citations={citations} />
          </article>
        ) : null}
      </section>

      <AgentPopup
        source={source.trim()}
        transcriptId={transcript?.transcript_id || null}
        sourceUrl={sourceUrl}
      />
    </main>
  );
}
