import { useState } from "react";

const DEFAULTS = {
  provider_name: "OpenAI-compatible",
  base_url: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  token_env: "LLM_API_TOKEN",
  api_token: "",
  temperature: 0.2,
  timeout: 90,
  top_k: 6,
  chunk_words: 220,
  languages: "en,en-US",
};

export default function SettingsWizard({ initialSettings, onSave }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initialSettings });
  const [storeToken, setStoreToken] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({ settings: form, store_token: storeToken });
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h1>Onboarding Wizard</h1>
      <p>Add your LLM provider once. Then use the local desktop/web app without CLI steps.</p>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Provider name
          <input name="provider_name" value={form.provider_name} onChange={updateField} />
        </label>

        <label>
          Base URL
          <input name="base_url" value={form.base_url} onChange={updateField} />
        </label>

        <label>
          Model
          <input name="model" value={form.model} onChange={updateField} />
        </label>

        <label>
          Token env name
          <input name="token_env" value={form.token_env} onChange={updateField} />
        </label>

        <label>
          API token
          <input
            type="password"
            name="api_token"
            value={form.api_token || ""}
            onChange={updateField}
            placeholder="paste token here"
          />
        </label>

        <label>
          Languages
          <input name="languages" value={form.languages} onChange={updateField} />
        </label>

        <label>
          Retrieval top-k
          <input
            type="number"
            name="top_k"
            value={form.top_k}
            min={1}
            max={20}
            onChange={updateField}
          />
        </label>

        <label>
          Chunk words
          <input
            type="number"
            name="chunk_words"
            value={form.chunk_words}
            min={80}
            max={600}
            onChange={updateField}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={storeToken}
            onChange={(event) => setStoreToken(event.target.checked)}
          />
          Save token locally for desktop convenience
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save and Continue"}
        </button>
      </form>
    </section>
  );
}
