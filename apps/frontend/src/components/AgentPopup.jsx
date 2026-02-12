import { useState } from "react";
import { askAgent } from "../services/api";
import CitationList from "./CitationList";

export default function AgentPopup({ source, transcriptId, sourceUrl }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);

  async function sendMessage(event) {
    event.preventDefault();
    const question = text.trim();
    if (!question || busy) {
      return;
    }

    setBusy(true);
    setError("");
    setText("");

    const localUserTurn = { role: "user", content: question };

    try {
      const response = await askAgent({
        question,
        source,
        transcript_id: transcriptId,
        history: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      });

      setMessages((prev) => [
        ...prev,
        localUserTurn,
        {
          role: "assistant",
          content: response.answer,
          citations: response.citations,
          sourceUrl: response.source_url || sourceUrl,
        },
      ]);
    } catch (err) {
      setError(err.message || "Agent request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="agent-fab" onClick={() => setOpen((prev) => !prev)}>
        {open ? "Close Agent" : "Talk to Agent"}
      </button>

      {open ? (
        <aside className="agent-popup">
          <header>
            <h2>Talk to Agent</h2>
            <p>Ask follow-up questions with citation-backed answers.</p>
          </header>

          <div className="agent-messages">
            {messages.length === 0 ? <p className="muted">No messages yet.</p> : null}
            {messages.map((msg, idx) => (
              <article key={`${msg.role}-${idx}`} className={`msg ${msg.role}`}>
                <strong>{msg.role === "assistant" ? "Agent" : "You"}</strong>
                <p>{msg.content}</p>
                {msg.role === "assistant" ? (
                  <CitationList sourceUrl={msg.sourceUrl} citations={msg.citations} />
                ) : null}
              </article>
            ))}
          </div>

          {error ? <p className="error">{error}</p> : null}

          <form onSubmit={sendMessage} className="agent-input-row">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask about this video..."
            />
            <button type="submit" disabled={busy || !source}>
              {busy ? "..." : "Send"}
            </button>
          </form>
        </aside>
      ) : null}
    </>
  );
}
