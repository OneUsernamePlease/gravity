
/*
Just Some functions
(hopefully moderately helpful)
*/

import { Vector2D } from "./vector2d";

//#region generic stuff
export function log(message: string) {
    const timestamp = new Date();
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');

    const formattedTimestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    console.log(`[${formattedTimestamp}] ${message}`);
}
/**
 * min and max included
 * @returns random number
 */
export function rng(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
//#endregion

//#region math stuff
/**
 * empty string is NOT considered numeric
 * @param s the string to be examined
 * @returns true if s is a valid number, returns false otherwise
 */
export function isNumeric(s: string): boolean {
    s = s.trim();
    return (!isNaN(+s)) && s.length !== 0;
}
/**
 * @returns "", if d is a non-numeric string
 */
export function decimalToHex(d: string | number): string {
    if (typeof(d) === "string")  {
        if (isNumeric(d)) {
            d = parseFloat(d);
        } else {
            return "";
        }
    }
    return d.toString(16);
}
/**
 * converts a hexadecimal-number-string to a decimal number and returns it
 * @returns 0 if hex is not a valid hexadecimal number
 */
export function hexToDecimal(hex: string): number {
    const prefix = "0x"
    if (!(hex.startsWith(prefix))) {
        hex = prefix + hex;
    }
    const num: number = Number(hex);
    const valid = !isNaN(num);
    return valid ? num : 0;
}
/**
 * 
 * @returns n if n satisfies min <= n <= max, otherwise min or max are returned
 * @param n number to test against upper and lower bounds
 * @param min the lowest allowed value for n
 * @param max the highest allowed value for n
 */
export function numberInRange(n: number, min: number, max: number): number {
    if (min > max) {
        throw new Error("In ensureNumberInRange: min cannot be greater than max");
    }
    return Math.max(min, Math.min(n, max))
}
export function isInRange(n: number, min: number, max: number): boolean {
    return n >= min && n <= max;
}
//#endregion

//#region string stuff
/**
 * Removes all occurrences of charToRemove from the beginning of str
 * @param str the string to be modified
 * @param charToRemove ***optional*** If no value is provided the first character of str is used. Can be more than one character.
 * @returns the modified string
 */
export function removeLeadingChar(str: string, charToRemove?: string): string {
    if (str.length < 1) { return ""; }
    if (charToRemove === undefined) {
        charToRemove = str[0];
    }

    while (str.startsWith(charToRemove)) {
        str = str.slice(charToRemove.length);
    }
    return str;
}
//#endregion

//#region input stuff
export function getInputValue(input: string | HTMLInputElement): string {
    let inputElement: HTMLInputElement;
    if (typeof input === "string") {
        inputElement = document.getElementById(input) as HTMLInputElement;
    } else {
        inputElement = input;
    }
    return inputElement.value.trim();
}
/**
 * @param input an HTMLInputElement, or the id for the Element
 * @returns element's value attribute; 0 if value is not numeric
 */
export function getInputNumber(input: string | HTMLInputElement): number {
    const inputValue = getInputValue(input);
    return isNumeric(inputValue) ? +inputValue : 0;
}
export function getAbsolutePointerPosition(ev: PointerEvent | WheelEvent | MouseEvent): { x: number, y: number } {
    return { x: ev.clientX, y: ev.clientY };
}

/**
 * Calculates and returns the velocity vector needed to get from *fromCoordinate* to *toCoordinate* in *timeFrameInSeconds* seconds
 * @param toCoordinate value in simulation space
 * @param fromCoordinate value in simulation space
 * @param timeFrameInSeconds *optional* defaults to 1
 */
export function calculateVelocityBetweenPoints(toCoordinate: Vector2D | {x: number, y: number}, fromCoordinate: Vector2D, timeFrameInSeconds: number = 1): Vector2D {
    if (timeFrameInSeconds <= 0) { timeFrameInSeconds = 1; }
    const toVector = toCoordinate instanceof Vector2D ? toCoordinate : new Vector2D(toCoordinate)
    const distance: Vector2D = toVector.subtract(fromCoordinate);
    return distance.scale(1 / timeFrameInSeconds);
}
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
//#endregion