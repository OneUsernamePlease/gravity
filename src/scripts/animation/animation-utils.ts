import { rng } from "../util/util";
/**
 * 
 * @param alpha value between 0 and 1. Defaults to 1 (opaque).
 * @returns a random hex-color-string in the format #RRGGBBAA
 */
export function randomHexColor(alpha: number = 1): string {
  alpha = Math.min(1, Math.max(0, alpha));
  const a = Math.round(alpha * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, "0");

  // Random RGB values
  const r = rng(0, 256);
  const g = rng(0, 256);
  const b = rng(0, 256);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}
/**
 * !!! COLORS MUST BE IN THE FORMAT #RRGGBBAA !!!
 * @param color1 #RRGGBBAA
 * @param weight1 
 * @param color2 #RRGGBBAA
 * @param weight2 
 * @returns the weighted, combined color of the inputs
 */
export function mixColorsWeighted(color1: string, weight1: number, color2: string, weight2: number): string {
    function parseHex(color: string): number[] {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const a = parseInt(color.slice(7, 9), 16);
        return [r, g, b, a];
    }

    // produce 2-digit hex
    const hex = (n: number) => n.toString(16).padStart(2, "0");

    const [r1, g1, b1, a1] = parseHex(color1);
    const [r2, g2, b2, a2] = parseHex(color2);

    const r = Math.round((r1 * weight1 + r2 * weight2) / (weight1 + weight2));
    const g = Math.round((g1 * weight1 + g2 * weight2) / (weight1 + weight2));
    const b = Math.round((b1 * weight1 + b2 * weight2) / (weight1 + weight2));
    const a = Math.round((a1 * weight1 + a2 * weight2) / (weight1 + weight2));

    return `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`;
}