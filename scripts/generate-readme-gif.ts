import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const WIDTH = 480;
const HEIGHT = 270;
const FPS = 12;
const FRAMES = 48;
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

  // Outer chrome
  fillRect(img, 18, 18, WIDTH - 36, HEIGHT - 36, COLORS.panel);
  strokeRect(img, 18, 18, WIDTH - 36, HEIGHT - 36, COLORS.stroke);
  fillRect(img, 18, 18, WIDTH - 36, 22, COLORS.panelAlt);
  drawText(img, 'CAPYAP', 28, 24, 2, COLORS.text);
  drawText(img, 'LOCAL AI', 372, 24, 1, COLORS.muted);

  // Left chapters rail
  fillRect(img, 32, 52, 140, 188, [10, 16, 30]);
  strokeRect(img, 32, 52, 140, 188, COLORS.stroke);
  drawText(img, 'CHAPTERS', 42, 60, 1, COLORS.muted);

  const chapterRows = ['INTRO', 'SETUP', 'AGENT CHAT', 'CITATIONS', 'EXPORT HTML'];
  const selected = Math.floor(t * chapterRows.length) % chapterRows.length;
  for (let i = 0; i < chapterRows.length; i += 1) {
    const y = 78 + (i * 31);
    const active = i === selected;
    const wobble = Math.round(Math.sin((t * Math.PI * 8) + i) * 2);
    fillRect(img, 40, y, 124, 24, active ? [19, 56, 92] : [15, 22, 40]);
    strokeRect(img, 40, y, 124, 24, active ? COLORS.accentStrong : COLORS.stroke);
    drawText(img, `${i}:${(i * 12).toString().padStart(2, '0')}`, 46 + wobble, y + 7, 1, COLORS.accent);
    drawText(img, chapterRows[i], 84, y + 7, 1, active ? COLORS.text : COLORS.muted);
  }

  // Main transcript/chat pane
  fillRect(img, 184, 52, 264, 188, [8, 13, 24]);
  strokeRect(img, 184, 52, 264, 188, COLORS.stroke);
  drawText(img, 'SESSION KEY NEVER SAVED', 194, 60, 1, COLORS.warning);

  // Transcript lines + animated citation pulse
  const pulse = Math.abs(Math.sin(t * Math.PI * 4));
  for (let i = 0; i < 7; i += 1) {
    const y = 80 + (i * 18);
    const w = 220 - ((i % 3) * 24);
    fillRect(img, 194, y, w, 8, [34, 48, 79]);
    if (i === 2 || i === 5) {
      const glow: RGB = [
        Math.round(lerp(50, 78, pulse)),
        Math.round(lerp(170, 223, pulse)),
        Math.round(lerp(150, 212, pulse)),
      ];
      fillRect(img, 194 + w + 6, y, 12, 8, glow);
    }
  }

  // Footer actions
  fillRect(img, 194, 214, 110, 18, [12, 33, 57]);
  strokeRect(img, 194, 214, 110, 18, COLORS.accentStrong);
  drawText(img, 'VIEW', 228, 219, 1, COLORS.text);

  fillRect(img, 312, 214, 126, 18, [16, 43, 33]);
  strokeRect(img, 312, 214, 126, 18, COLORS.accent);
  drawText(img, 'HTML EXPORT', 334, 219, 1, COLORS.text);

  // Animated top-right spark
  const sparkX = 430 + Math.round(Math.sin(t * Math.PI * 6) * 6);
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
