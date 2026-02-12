function toYouTubeTimestampLink(sourceUrl, seconds) {
  if (!sourceUrl || !sourceUrl.includes("youtube.com") || Number.isNaN(seconds)) {
    return null;
  }

  const safe = Math.max(0, Math.floor(seconds));
  const separator = sourceUrl.includes("?") ? "&" : "?";
  return `${sourceUrl}${separator}t=${safe}s`;
}

export default function CitationList({ sourceUrl, citations }) {
  if (!citations?.length) {
    return null;
  }

  return (
    <ul className="citation-list">
      {citations.map((citation) => {
        const timestampUrl = toYouTubeTimestampLink(sourceUrl, citation.start_seconds);
        return (
          <li key={`${citation.chunk_id}-${citation.start_seconds}`}>
            <strong>[chunk-{citation.chunk_id}]</strong>{" "}
            {timestampUrl ? (
              <a href={timestampUrl} target="_blank" rel="noreferrer">
                {citation.start_label} - {citation.end_label}
              </a>
            ) : (
              <span>
                {citation.start_label} - {citation.end_label}
              </span>
            )}
            <p>{citation.text}</p>
          </li>
        );
      })}
    </ul>
  );
}
