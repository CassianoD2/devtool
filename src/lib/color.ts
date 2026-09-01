/** Conversão de cores (hex/rgb/hsl/hsv) e contraste WCAG. Offline, sem dependências. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function parseColor(input: string): Rgb {
  const s = input.trim().toLowerCase();

  // #rgb / #rgba / #rrggbb / #rrggbbaa
  const hex = s.match(/^#?([0-9a-f]{3,8})$/i);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      const [r, g, b, a = "f"] = h.split("");
      return {
        r: parseInt(r + r, 16),
        g: parseInt(g + g, 16),
        b: parseInt(b + b, 16),
        a: parseInt(a + a, 16) / 255,
      };
    }
    if (h.length === 6 || h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      };
    }
  }

  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[,/]+/).map((p) => p.trim());
    const val = (p: string, max: number) =>
      p.endsWith("%") ? (parseFloat(p) / 100) * max : parseFloat(p);
    return {
      r: clamp(Math.round(val(parts[0], 255)), 0, 255),
      g: clamp(Math.round(val(parts[1], 255)), 0, 255),
      b: clamp(Math.round(val(parts[2], 255)), 0, 255),
      a: parts[3] != null ? clamp(val(parts[3], 1), 0, 1) : 1,
    };
  }

  const hsl = s.match(/^hsla?\(([^)]+)\)$/);
  if (hsl) {
    const parts = hsl[1].split(/[,/]+/).map((p) => p.trim());
    const h = parseFloat(parts[0]);
    const sl = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    const a = parts[3] != null ? (parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])) : 1;
    return { ...hslToRgb(h, sl, l), a: clamp(a, 0, 1) };
  }

  throw new Error("Cor não reconhecida. Use #hex, rgb() ou hsl().");
}

function hslToRgb(h: number, s: number, l: number): Omit<Rgb, "a"> {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = (
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  ).map((v) => Math.round((v + m) * 255));
  return { r, g, b };
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToHsv({ r, g, b }: Rgb): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h = h * 60;
    if (h < 0) h += 360;
  }
  return {
    h: Math.round(h),
    s: Math.round((max === 0 ? 0 : d / max) * 100),
    v: Math.round(max * 100),
  };
}

const toHex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

export function formatColor(c: Rgb) {
  const hsl = rgbToHsl(c);
  const hsv = rgbToHsv(c);
  const hasAlpha = c.a < 1;
  return {
    hex: `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}${hasAlpha ? toHex2(c.a * 255) : ""}`,
    rgb: hasAlpha
      ? `rgba(${c.r}, ${c.g}, ${c.b}, ${+c.a.toFixed(3)})`
      : `rgb(${c.r}, ${c.g}, ${c.b})`,
    hsl: hasAlpha
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${+c.a.toFixed(3)})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
  };
}

// ---------- WCAG contraste ----------

function relLuminance({ r, g, b }: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export interface ContrastResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export function contrast(fg: Rgb, bg: Rgb): ContrastResult {
  const l1 = relLuminance(fg);
  const l2 = relLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const r = Math.round(ratio * 100) / 100;
  return {
    ratio: r,
    aaNormal: r >= 4.5,
    aaLarge: r >= 3,
    aaaNormal: r >= 7,
    aaaLarge: r >= 4.5,
  };
}
