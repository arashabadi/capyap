import { SourceMetadata } from '../types';
import { buildYouTubeTimestampUrl, isYouTubeUrl } from './youtube';

export const downloadTranscript = (
  source: SourceMetadata,
  format: 'txt' | 'txt-timestamps' | 'json' | 'html',
) => {
  let content = '';
  let mimeType = 'text/plain';
  let extension = 'txt';

  switch (format) {
    case 'json':
      content = JSON.stringify(source, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'txt-timestamps':
      content = source.segments
        .map(s => `[${formatTime(s.start)}] ${s.text}`)
        .join('\n');
      break;
    case 'html':
      content = buildHtmlExport(source);
      mimeType = 'text/html;charset=utf-8';
      extension = 'html';
      break;
    case 'txt':
    default:
      content = source.segments
        .map(s => s.text)
        .join('\n');
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${source.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const buildHtmlExport = (source: SourceMetadata): string => {
  const youtubeEnabled = source.sourceType === 'youtube' && isYouTubeUrl(source.url);
  const nearestSegmentAnchor = (targetStart: number): string => {
    if (source.segments.length === 0) {
      return 'segments';
    }
    let bestIndex = 0;
    let bestDelta = Math.abs(source.segments[0].start - targetStart);
    for (let i = 1; i < source.segments.length; i += 1) {
      const delta = Math.abs(source.segments[i].start - targetStart);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = i;
      }
    }
    return `seg-${bestIndex}`;
  };

  const chaptersHtml = source.chapters
    .map((chapter) => {
      const chapterStartTs = formatTime(chapter.start);
      const chapterAnchor = nearestSegmentAnchor(chapter.start);
      const chapterDeepLink = youtubeEnabled
        ? buildYouTubeTimestampUrl(source.url, chapter.start)
        : null;
      const chapterView = chapterDeepLink
        ? `<a class="view-btn" href="${escapeHtml(chapterDeepLink)}" target="_blank" rel="noopener noreferrer">View</a>`
        : '';
      return `
        <li class="chapter-item">
          <a class="chapter-jump" href="#${chapterAnchor}">
            <span class="chapter-time">${chapterStartTs}</span>
            <span class="chapter-title">${escapeHtml(chapter.title)}</span>
          </a>
          ${chapterView}
        </li>
      `;
    })
    .join('\n');

  const segmentsHtml = source.segments
    .map((segment, index) => {
      const ts = formatTime(segment.start);
      const deepLink = youtubeEnabled
        ? buildYouTubeTimestampUrl(source.url, segment.start)
        : null;
      const tsHtml = deepLink
        ? `<a class="timestamp-link" href="${escapeHtml(deepLink)}" target="_blank" rel="noopener noreferrer">${ts}</a>`
        : `<span class="timestamp-label">${ts}</span>`;
      const viewButton = deepLink
        ? `<a class="view-btn" href="${escapeHtml(deepLink)}" target="_blank" rel="noopener noreferrer">View</a>`
        : '';
      return `
        <article class="segment" id="seg-${index}">
          <div class="segment-head">
            <div class="timestamp">${tsHtml}</div>
            ${viewButton}
          </div>
          <p>${escapeHtml(segment.text)}</p>
        </article>
      `;
    })
    .join('\n');

  const sourceLine = source.url ? `<p class="meta">Source: ${escapeHtml(source.url)}</p>` : '';
  const clickHelp = youtubeEnabled
    ? '<p class="meta">Tip: use chapter links to jump in this document, and use View to open YouTube at that timestamp.</p>'
    : '';
  const chapterSection = source.chapters.length > 0
    ? `
      <aside class="chapters">
        <h2>Chapters</h2>
        <ol>
          ${chaptersHtml}
        </ol>
      </aside>
    `
    : `
      <aside class="chapters">
        <h2>Chapters</h2>
        <p class="chapter-empty">No chapter timeline available for this source.</p>
      </aside>
    `;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(source.title)} - Capyap HTML Export</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        background: #f8fafc;
        color: #0f172a;
      }
      main {
        max-width: 920px;
        margin: 0 auto;
        padding: 24px 20px 40px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      .meta {
        margin: 0 0 6px;
        color: #475569;
        font-size: 14px;
      }
      .section {
        margin-top: 22px;
      }
      .content-grid {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }
      .chapters {
        position: sticky;
        top: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #ffffff;
        padding: 10px;
      }
      .chapters h2 {
        margin: 0 0 8px;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #475569;
      }
      .chapters ol {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .chapter-empty {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }
      .chapter-item {
        display: flex;
        gap: 8px;
        align-items: start;
      }
      .chapter-jump {
        flex: 1;
        display: block;
        text-decoration: none;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px;
      }
      .chapter-time {
        display: block;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        color: #0f766e;
      }
      .chapter-title {
        display: block;
        margin-top: 2px;
        font-size: 13px;
        color: #0f172a;
      }
      .segment {
        border: 1px solid #e2e8f0;
        background: #ffffff;
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 10px;
      }
      .segment-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .segment .timestamp {
        margin-bottom: 6px;
      }
      .timestamp-link,
      .timestamp-label {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 13px;
      }
      .timestamp-link {
        text-decoration: none;
        color: #1d4ed8;
      }
      .view-btn {
        text-decoration: none;
        font-size: 11px;
        font-weight: 600;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        border-radius: 999px;
        padding: 3px 8px;
      }
      .segment p {
        margin: 0;
        font-size: 17px;
      }
      @media (max-width: 900px) {
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: #020617;
          color: #e2e8f0;
        }
        .meta {
          color: #94a3b8;
        }
        .segment {
          border-color: #1e293b;
          background: #0f172a;
        }
        .chapters {
          border-color: #1e293b;
          background: #0f172a;
        }
        .chapters h2 {
          color: #94a3b8;
        }
        .chapter-empty {
          color: #94a3b8;
        }
        .chapter-jump {
          border-color: #1e293b;
          background: #020617;
        }
        .chapter-time {
          color: #5eead4;
        }
        .chapter-title {
          color: #e2e8f0;
        }
        .timestamp-link {
          color: #93c5fd;
        }
        .view-btn {
          color: #93c5fd;
          border-color: #334155;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(source.title)}</h1>
      <p class="meta">Generated by Capyap</p>
      <p class="meta">Words: ${source.wordCount.toLocaleString()} | Segments: ${source.segments.length}</p>
      ${sourceLine}
      ${clickHelp}
      <section class="section">
        <div class="content-grid">
          ${chapterSection}
          <div id="segments">
            ${segmentsHtml}
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
};

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    const remMins = Math.floor((seconds % 3600) / 60);
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
