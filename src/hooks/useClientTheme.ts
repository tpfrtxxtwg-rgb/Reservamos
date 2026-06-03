import { useEffect } from "react";
import { useClientAuth } from "@/providers/ClientAuthProvider";
import { trpc } from "@/providers/trpc";

/**
 * useClientTheme - Reads the client's primaryColor from their settings
 * and dynamically applies it to CSS variables so the entire dashboard
 * reflects the custom brand color.
 *
 * Used in: ClientAuthProvider (so it runs for all authenticated users)
 */
export function useClientTheme() {
  const { isAuthenticated } = useClientAuth();
  const { data: settings } = trpc.clientSettings.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!settings?.primaryColor) return;

    const color = settings.primaryColor;
    const root = document.documentElement;

    // Set the main brand color
    root.style.setProperty("--terracotta", color);

    // Compute a darker variant for hover states
    const darker = darkenColor(color, 20);
    root.style.setProperty("--terracotta-dark", darker);

    // Also set RGB versions for opacity-based utilities
    const rgb = hexToRgb(color);
    if (rgb) {
      root.style.setProperty("--terracotta-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }, [settings?.primaryColor]);
}

/** Darken a hex color by a percentage (0-100) */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.max(0, Math.floor(rgb.r * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - percent / 100)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - percent / 100)));

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}
