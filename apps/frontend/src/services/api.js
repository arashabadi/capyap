const JSON_HEADERS = {
  "Content-Type": "application/json",
};

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const detail = payload?.detail || `${response.status} ${response.statusText}`;
    throw new Error(detail);
  }

  return payload;
}

export function getSettings() {
  return request("/api/settings");
}

export function saveSettings(body) {
  return request("/api/settings", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function loadTranscript(body) {
  return request("/api/transcripts/load", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function askAgent(body) {
  return request("/api/agent/chat", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}
