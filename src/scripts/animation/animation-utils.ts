import { rng, twoDigitHex } from "../util/util";
/**
 * 
 * @param alpha value between 0 and 1. Defaults to 1 (opaque).
 * @returns a random hex-color-string in the format #RRGGBBAA
 */ 
export function randomHexColor(alpha: number = 1): string {
    alpha = Math.min(1, Math.max(0, alpha));
    const a = Math.round(alpha * 255);

    const toHex = (n: number) => n.toString(16).padStart(2, "0");


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

    const [r1, g1, b1, a1] = parseHex(color1);
    const [r2, g2, b2, a2] = parseHex(color2);

    const r = Math.round((r1 * weight1 + r2 * weight2) / (weight1 + weight2));
    const g = Math.round((g1 * weight1 + g2 * weight2) / (weight1 + weight2));
    const b = Math.round((b1 * weight1 + b2 * weight2) / (weight1 + weight2));
    const a = Math.round((a1 * weight1 + a2 * weight2) / (weight1 + weight2));

    return `#${twoDigitHex(r)}${twoDigitHex(g)}${twoDigitHex(b)}${twoDigitHex(a)}`;
}
export function massDependentColor(mass: number): string {
    const lowestColorMass = 50;
    const biggestColorMass = 100000000;
    const alpha = "ff";

    if (mass <= lowestColorMass) {
        return "#ff0000ff";
    }
    if (mass >= biggestColorMass) {
        return "#0000ffff";
    }
    const mid = Math.sqrt(lowestColorMass * biggestColorMass)
    let r,g,b;

    if (mass < mid) {
        // Red -> White
        const t = (Math.log(mass) - Math.log(lowestColorMass)) / (Math.log(mid) - Math.log(lowestColorMass));
        r = 255;
        g = Math.round(255 * t);
        b = Math.round(255 * t);
    } else {
        // White -> Blue
        const t = (Math.log(mass) - Math.log(mid)) / (Math.log(biggestColorMass) - Math.log(mid));
        r = Math.round(255 * (1 - t));
        g = Math.round(255 * (1 - t));
        b = 255;
    }

    return `#${twoDigitHex(r)}${twoDigitHex(g)}${twoDigitHex(b)}${alpha}`;
}