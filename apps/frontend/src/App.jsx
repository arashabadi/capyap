import { useEffect, useState } from "react";
import SettingsWizard from "./components/SettingsWizard";
import WorkspacePage from "./pages/WorkspacePage";
import { getSettings, saveSettings } from "./services/api";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError("");
      try {
        const data = await getSettings();
        setSettings(data.settings);
        setHasToken(data.has_token);
      } catch (err) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function handleSave(payload) {
    const data = await saveSettings(payload);
    setSettings(data.settings);
    setHasToken(data.has_token);
  }

  if (loading) {
    return (
      <main className="workspace">
        <section className="panel">
          <p>Loading local app settings...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="workspace">
        <section className="panel">
          <p className="error">{error}</p>
        </section>
      </main>
    );
  }

  if (!hasToken) {
    return (
      <main className="workspace">
        <SettingsWizard initialSettings={settings} onSave={handleSave} />
      </main>
    );
  }

  return <WorkspacePage />;
}
