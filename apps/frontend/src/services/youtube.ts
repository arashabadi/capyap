const YOUTUBE_HOST_PATTERNS = [
  "youtube.com",
  "youtu.be",
  "m.youtube.com",
  "www.youtube.com",
];

function normalizeSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return 0;
  }
  return Math.max(0, Math.floor(seconds));
}

export function isYouTubeUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return YOUTUBE_HOST_PATTERNS.some((pattern) => host === pattern || host.endsWith(`.${pattern}`));
  } catch {
    return false;
  }
}

export function buildYouTubeTimestampUrl(
  url: string | undefined,
  seconds: number,
): string | null {
  if (!isYouTubeUrl(url)) {
    return null;
  }

  const t = normalizeSeconds(seconds);

  try {
    const parsed = new URL(url as string);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      parsed.searchParams.set("t", `${t}s`);
    } else {
      parsed.searchParams.set("t", `${t}s`);
      if (!parsed.searchParams.get("v")) {
        const maybeId = parsed.pathname.split("/").filter(Boolean).pop();
        if (maybeId && maybeId !== "watch") {
          parsed.searchParams.set("v", maybeId);
          parsed.pathname = "/watch";
        }
      }
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
