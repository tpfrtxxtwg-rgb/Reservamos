import { useMemo } from 'react';

export interface WidgetPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryRgb: string;
  primaryR: number;
  primaryG: number;
  primaryB: number;
  // Pre-computed rgba strings for common opacities
  primary04: string;  // 4% opacity - selection backgrounds
  primary06: string;  // 6% opacity
  primary08: string;  // 8% opacity - error/success bg
  primary10: string;  // 10% opacity - focus rings
  primary15: string;  // 15% opacity - borders, progress bg
  primary25: string;  // 25% opacity - shadows
  primary50: string;  // 50% opacity - disabled states
  primary80: string;  // 80% opacity - text
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

function darken(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.floor(rgb.r * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - percent / 100)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - percent / 100)));
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function lighten(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * (percent / 100)));
  const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * (percent / 100)));
  const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * (percent / 100)));
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const DEFAULT_PRIMARY = '#C75E3A';

export function useWidgetTheme(primaryColor?: string | null): WidgetPalette {
  return useMemo(() => {
    const hex = primaryColor || DEFAULT_PRIMARY;
    const rgb = hexToRgb(hex);
    const r = rgb?.r ?? 199;
    const g = rgb?.g ?? 94;
    const b = rgb?.b ?? 58;

    return {
      primary: hex,
      primaryDark: darken(hex, 20),
      primaryLight: lighten(hex, 15),
      primaryRgb: `${r}, ${g}, ${b}`,
      primaryR: r,
      primaryG: g,
      primaryB: b,
      primary04: rgba(r, g, b, 0.04),
      primary06: rgba(r, g, b, 0.06),
      primary08: rgba(r, g, b, 0.08),
      primary10: rgba(r, g, b, 0.10),
      primary15: rgba(r, g, b, 0.15),
      primary25: rgba(r, g, b, 0.25),
      primary50: rgba(r, g, b, 0.50),
      primary80: rgba(r, g, b, 0.80),
    };
  }, [primaryColor]);
}

// Helper to create inline style objects for common patterns
export function themeStyle(palette: WidgetPalette, type: 'bg' | 'text' | 'border' | 'shadow', opacity?: number): React.CSSProperties {
  const a = opacity ?? 1;
  switch (type) {
    case 'bg':
      return { backgroundColor: a < 1 ? rgba(palette.primaryR, palette.primaryG, palette.primaryB, a) : palette.primary };
    case 'text':
      return { color: a < 1 ? rgba(palette.primaryR, palette.primaryG, palette.primaryB, a) : palette.primary };
    case 'border':
      return { borderColor: a < 1 ? rgba(palette.primaryR, palette.primaryG, palette.primaryB, a) : palette.primary };
    case 'shadow':
      return { boxShadow: `0 2px 8px ${rgba(palette.primaryR, palette.primaryG, palette.primaryB, a)}` };
    default:
      return {};
  }
}
