import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const WIDTH = 480;
const HEIGHT = 270;
const FPS = 12;
const FRAMES = 120;
const OUTPUT = join(process.cwd(), 'docs/assets/capyap-demo.gif');

type RGB = [number, number, number];

const COLORS = {
  bgTop: [8, 12, 24] as RGB,
  bgBottom: [3, 5, 11] as RGB,
  panel: [13, 18, 34] as RGB,
  panelAlt: [18, 24, 44] as RGB,
  stroke: [48, 62, 102] as RGB,
  text: [222, 233, 255] as RGB,
  muted: [137, 156, 204] as RGB,
  accent: [66, 219, 194] as RGB,
  accentStrong: [38, 145, 232] as RGB,
  warning: [244, 188, 97] as RGB,
};

type Canvas = Uint8Array;

const glyphs: Record<string, string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '00110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

const clamp = (v: number, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, v));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (edge0: number, edge1: number, x: number) => {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - (2 * t));
};

const setPixel = (img: Canvas, x: number, y: number, c: RGB) => {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
};

const fillRect = (img: Canvas, x: number, y: number, w: number, h: number, c: RGB) => {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(WIDTH, x + w);
  const y1 = Math.min(HEIGHT, y + h);
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      setPixel(img, xx, yy, c);
    }
  }
};

const strokeRect = (img: Canvas, x: number, y: number, w: number, h: number, c: RGB) => {
  fillRect(img, x, y, w, 1, c);
  fillRect(img, x, y + h - 1, w, 1, c);
  fillRect(img, x, y, 1, h, c);
  fillRect(img, x + w - 1, y, 1, h, c);
};

const blendBg = (img: Canvas, t: number) => {
  for (let y = 0; y < HEIGHT; y += 1) {
    const fy = y / (HEIGHT - 1);
    for (let x = 0; x < WIDTH; x += 1) {
      const fx = x / (WIDTH - 1);
      const wave = Math.sin((fx * 9) + (t * Math.PI * 2)) * 0.03;
      const mix = clamp(fy + wave, 0, 1);
      const r = Math.round(lerp(COLORS.bgTop[0], COLORS.bgBottom[0], mix));
      const g = Math.round(lerp(COLORS.bgTop[1], COLORS.bgBottom[1], mix));
      const b = Math.round(lerp(COLORS.bgTop[2], COLORS.bgBottom[2], mix));
      setPixel(img, x, y, [r, g, b]);
    }
  }
};

const drawChar = (img: Canvas, ch: string, x: number, y: number, scale: number, c: RGB) => {
  const pattern = glyphs[ch] ?? glyphs[' '];
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] !== '1') continue;
      fillRect(img, x + (col * scale), y + (row * scale), scale, scale, c);
    }
  }
};

const drawText = (img: Canvas, text: string, x: number, y: number, scale: number, c: RGB) => {
  let cursor = x;
  for (const rawCh of text.toUpperCase()) {
    const ch = glyphs[rawCh] ? rawCh : ' ';
    drawChar(img, ch, cursor, y, scale, c);
    cursor += (6 * scale);
  }
};

const renderFrame = (frame: number): Canvas => {
  const t = frame / (FRAMES - 1);
  const img = new Uint8Array(WIDTH * HEIGHT * 3);
  blendBg(img, t);

  // Scene 1: intro page. Keep this visible long enough before any UI transition.
  if (t < 0.42) {
    const introProgress = smoothstep(0.02, 0.36, t);
    const pulse = 1 + (Math.sin(t * Math.PI * 6) * 0.015);
    const cardW = Math.round(350 * pulse);
    const cardH = 124;
    const cardX = Math.round((WIDTH - cardW) / 2);
    const cardY = 72;

    fillRect(img, cardX, cardY, cardW, cardH, COLORS.panel);
    strokeRect(img, cardX, cardY, cardW, cardH, COLORS.accentStrong);
    drawText(img, 'PASTE YOUTUBE LINK', cardX + 16, cardY + 12, 1, COLORS.text);

    fillRect(img, cardX + 14, cardY + 34, cardW - 28, 30, [9, 13, 25]);
    strokeRect(img, cardX + 14, cardY + 34, cardW - 28, 30, COLORS.stroke);

    const typed = 'HTTPS YOUTUBE COM WATCH';
    const typedCount = Math.max(1, Math.floor(typed.length * introProgress));
    drawText(img, typed.slice(0, typedCount), cardX + 22, cardY + 45, 1, COLORS.accent);

    fillRect(img, cardX + cardW - 110, cardY + 80, 96, 24, [16, 47, 36]);
    strokeRect(img, cardX + cardW - 110, cardY + 80, 96, 24, COLORS.accent);
    drawText(img, 'LOAD', cardX + cardW - 76, cardY + 88, 1, COLORS.text);

    drawText(img, 'LOCAL  PRIVATE', cardX + 18, cardY + 88, 1, COLORS.warning);
    return img;
  }

  const workspaceReveal = smoothstep(0.42, 0.64, t);
  const keyModalReveal = smoothstep(0.70, 0.82, t) * (1 - smoothstep(0.95, 0.995, t));
  const agentReveal = smoothstep(0.84, 0.985, t);

  // Outer app chrome
  fillRect(img, 18, 18, WIDTH - 36, HEIGHT - 36, COLORS.panel);
  strokeRect(img, 18, 18, WIDTH - 36, HEIGHT - 36, COLORS.stroke);
  fillRect(img, 18, 18, WIDTH - 36, 22, COLORS.panelAlt);
  drawText(img, 'CapYap', 28, 24, 2, COLORS.text);
  drawText(img, 'LOCAL AI', 372, 24, 1, COLORS.muted);

  // Left chapters rail
  const railW = Math.max(1, Math.round(140 * workspaceReveal));
  fillRect(img, 32, 52, railW, 188, [10, 16, 30]);
  strokeRect(img, 32, 52, railW, 188, COLORS.stroke);
  if (workspaceReveal > 0.5) {
    drawText(img, 'CHAPTERS', 42, 60, 1, COLORS.muted);
  }

  const chapterRows = ['INTRO', 'SETUP', 'AGENT CHAT', 'CITATIONS', 'EXPORT HTML'];
  const selected = Math.floor((t * chapterRows.length) + 1) % chapterRows.length;
  for (let i = 0; i < chapterRows.length; i += 1) {
    if (workspaceReveal <= 0.55) continue;
    const y = 78 + (i * 31);
    const active = i === selected;
    const wobble = Math.round(Math.sin((t * Math.PI * 8) + i) * 2);
    fillRect(img, 40, y, 124, 24, active ? [19, 56, 92] : [15, 22, 40]);
    strokeRect(img, 40, y, 124, 24, active ? COLORS.accentStrong : COLORS.stroke);
    drawText(img, `${i}:${(i * 12).toString().padStart(2, '0')}`, 46 + wobble, y + 7, 1, COLORS.accent);
    drawText(img, chapterRows[i], 84, y + 7, 1, active ? COLORS.text : COLORS.muted);
  }

  // Main transcript/chat pane
  const mainX = 184;
  const mainY = 52;
  const mainW = 264;
  const mainH = 188;
  fillRect(img, mainX, mainY, mainW, mainH, [8, 13, 24]);
  strokeRect(img, mainX, mainY, mainW, mainH, COLORS.stroke);

  // Two clear transcript chunks (Docker tutorial style)
  const chunkRows = [
    {
      title: 'CHUNK 1  DOCKER TUTORIAL',
      lineA: 'BUILD IMAGE  RUN CONTAINER',
      lineB: 'TEST WEB APP ON LOCALHOST',
    },
    {
      title: 'CHUNK 2  COMPOSE AND CI CD',
      lineA: 'ADD API  CLIENT  DATABASE',
      lineB: 'GITHUB ACTION DEPLOY FLOW',
    },
  ];
  const activeChunk = Math.floor((t * 4) % chunkRows.length);
  const pulse = Math.abs(Math.sin(t * Math.PI * 4));
  const transcriptW = Math.round(240 * (0.86 - (0.30 * agentReveal)));

  for (let i = 0; i < chunkRows.length; i += 1) {
    if (workspaceReveal <= 0.35) continue;
    const y = 84 + (i * 56);
    const w = Math.max(150, transcriptW - ((i % 2) * 10));
    const isActive = i === activeChunk;
    fillRect(img, 194, y, w, 44, isActive ? [24, 56, 88] : [24, 34, 57]);
    strokeRect(img, 194, y, w, 44, isActive ? COLORS.accentStrong : COLORS.stroke);

    const maxChars = Math.max(10, Math.floor((w - 12) / 6));
    drawText(
      img,
      chunkRows[i].title.slice(0, maxChars),
      198,
      y + 4,
      1,
      isActive ? COLORS.text : COLORS.muted,
    );
    drawText(
      img,
      chunkRows[i].lineA.slice(0, maxChars),
      198,
      y + 16,
      1,
      isActive ? COLORS.text : COLORS.muted,
    );
    drawText(
      img,
      chunkRows[i].lineB.slice(0, maxChars),
      198,
      y + 28,
      1,
      isActive ? COLORS.text : COLORS.muted,
    );

    const glow: RGB = [
      Math.round(lerp(50, 78, pulse)),
      Math.round(lerp(170, 223, pulse)),
      Math.round(lerp(150, 212, pulse)),
    ];
    fillRect(img, 194 + w + 4, y + 18, 6, 6, isActive ? glow : [40, 54, 86]);
  }

  // Footer actions
  if (workspaceReveal > 0.5) {
    fillRect(img, 194, 214, 86, 18, [12, 33, 57]);
    strokeRect(img, 194, 214, 86, 18, COLORS.accentStrong);
    drawText(img, 'VIEW', 220, 219, 1, COLORS.text);

    fillRect(img, 288, 214, 150, 18, [16, 43, 33]);
    strokeRect(img, 288, 214, 150, 18, COLORS.accent);
    drawText(img, 'HTML EXPORT', 328, 219, 1, COLORS.text);
  }

  // Secure API key modal scene.
  if (keyModalReveal > 0.02) {
    const modalW = 258;
    const modalH = 102;
    const modalX = Math.round((WIDTH - modalW) / 2);
    const modalY = 82;
    fillRect(img, modalX, modalY, modalW, modalH, COLORS.panel);
    strokeRect(img, modalX, modalY, modalW, modalH, COLORS.accentStrong);
    drawText(img, 'SECURE API KEY', modalX + 18, modalY + 14, 1, COLORS.text);
    drawText(img, 'SESSION ONLY', modalX + 174, modalY + 14, 1, COLORS.warning);

    fillRect(img, modalX + 16, modalY + 34, modalW - 32, 28, [9, 13, 25]);
    strokeRect(img, modalX + 16, modalY + 34, modalW - 32, 28, COLORS.stroke);

    const keyProgress = smoothstep(0.54, 0.67, t);
    const hidden = 'XXXXXXXXXXXXXXXX';
    const chars = Math.max(1, Math.floor(hidden.length * keyProgress));
    drawText(img, hidden.slice(0, chars), modalX + 26, modalY + 44, 1, COLORS.accent);

    drawText(img, 'KEY NEVER SAVED TO DISK', modalX + 18, modalY + 67, 1, COLORS.warning);

    fillRect(img, modalX + modalW - 106, modalY + 74, 90, 20, [16, 47, 36]);
    strokeRect(img, modalX + modalW - 106, modalY + 74, 90, 20, COLORS.accent);
    drawText(img, keyProgress > 0.72 ? 'CONNECT' : 'START', modalX + modalW - 90, modalY + 81, 1, COLORS.text);
  }

  // Agent panel appears scene.
  if (agentReveal > 0.03) {
    const panelW = Math.max(1, Math.round(112 * agentReveal));
    const panelX = mainX + mainW - panelW - 4;
    fillRect(img, panelX, mainY + 4, panelW, mainH - 8, [11, 16, 31]);
    strokeRect(img, panelX, mainY + 4, panelW, mainH - 8, COLORS.stroke);

    if (agentReveal > 0.45) {
      drawText(img, 'AGENT', panelX + 12, mainY + 14, 1, COLORS.accent);
      fillRect(img, panelX + 10, mainY + 30, panelW - 20, 18, [21, 34, 59]);
      fillRect(img, panelX + 18, mainY + 56, panelW - 28, 18, [16, 47, 36]);
      fillRect(img, panelX + 10, mainY + 82, panelW - 20, 18, [21, 34, 59]);
      drawText(img, 'READY', panelX + 20, mainY + 106, 1, COLORS.text);
      drawText(img, 'ASK', panelX + 24, mainY + 128, 1, COLORS.accent);
    }
  }

  // Animated top-right spark
  const sparkX = 430 + Math.round(Math.sin(t * Math.PI * 8) * 6);
  const sparkY = 84 + Math.round(Math.cos(t * Math.PI * 6) * 4);
  fillRect(img, sparkX, sparkY, 4, 4, COLORS.accent);
  fillRect(img, sparkX - 6, sparkY + 1, 4, 2, COLORS.accent);
  fillRect(img, sparkX + 6, sparkY + 1, 4, 2, COLORS.accent);

  return img;
};

const writePpm = (path: string, img: Canvas) => {
  const header = Buffer.from(`P6\n${WIDTH} ${HEIGHT}\n255\n`, 'ascii');
  writeFileSync(path, Buffer.concat([header, Buffer.from(img)]));
};

const main = () => {
  mkdirSync(join(process.cwd(), 'docs/assets'), { recursive: true });
  const framesDir = mkdtempSync(join(tmpdir(), 'capyap-gif-'));

  for (let i = 0; i < FRAMES; i += 1) {
    const framePath = join(framesDir, `frame_${String(i).padStart(3, '0')}.ppm`);
    writePpm(framePath, renderFrame(i));
  }

  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-framerate', String(FPS),
      '-i', join(framesDir, 'frame_%03d.ppm'),
      '-vf',
      `fps=${FPS},split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`,
      OUTPUT,
    ],
    { stdio: 'inherit' },
  );

  rmSync(framesDir, { recursive: true, force: true });
  console.log(`Wrote ${OUTPUT}`);
};

main();
