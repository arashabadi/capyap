type TauriInternals = {
  invoke?: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
};

function getTauriInvoke():
  | ((command: string, args?: Record<string, unknown>) => Promise<unknown>)
  | null {
  if (typeof window === "undefined") return null;
  const maybeInternals = (window as unknown as { __TAURI_INTERNALS__?: TauriInternals })
    .__TAURI_INTERNALS__;
  if (typeof maybeInternals?.invoke === "function") {
    return maybeInternals.invoke;
  }
  return null;
}

export async function openExternalUrl(url: string): Promise<void> {
  const target = (url || "").trim();
  if (!target) {
    throw new Error("URL is empty.");
  }

  const tauriInvoke = getTauriInvoke();
  if (tauriInvoke) {
    await tauriInvoke("open_external_url", { url: target });
    return;
  }

  const opened = window.open(target, "_blank", "noopener,noreferrer");
  if (!opened) {
    throw new Error("Could not open URL in browser.");
  }
}
