
/*
Just Some functions
(hopefully moderately helpful)
*/

import { Vector2D } from "./vector2d.js";

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
 * Generates an integer between min and max (both included).
 * @returns random number
 */
export function rng(min: number, max: number) {
    if (min > max) {
        throw new Error('min must be <= max');
    }
    return Math.floor(Math.random() * (max - min + 1) + min);
}
//#endregion

//#region math stuff
type MagnitudeMode =  "1-10" | "1-5-10" | "1-2-5-10";
const magnitudeModeSteps: Record<MagnitudeMode, number[]> = {
    "1-10": [1],
    "1-5-10": [1,5],
    "1-2-5-10": [1,2,5],
}
/**
 * Returns the largest "nice" magnitude less than or equal to `n`.
 *
 * Examples:
 *
 * magnitude(40, "1-10")       // 10
 * magnitude(40, "1-2-5-10")   // 20
 *
 * magnitude(0.11)             // 0.1
 *
 * magnitude(775, "1-10")      // 100
 * magnitude(775, "1-2-5-10")  // 500
 * magnitude(775, "1-5-10")    // 500
 *
 * magnitude(1)                // 1
 * magnitude(10)               // 10
 * magnitude(1000)             // 1000
 *
 * magnitude(-42, "1-2-5-10")  // -20
 * magnitude(0)                // 0
 */
export function magnitude(n: number, mode: MagnitudeMode = "1-10") {
    if (n === 0) {
        return 0;
    }
    const sign = n < 0 ? -1 : 1;
    
    n = Math.abs(n)

    const basePower = 10 ** Math.floor(Math.log10(n));
    const normalized = n / basePower;

    const steps = magnitudeModeSteps[mode];

    for (let i = steps.length - 1; i >= 0; i--) {
    if (normalized >= steps[i]) {
            return steps[i] * basePower * sign;
        }
    }

    return steps[0] * basePower / 10 * sign;
}
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
            throw new Error("invalid input");
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
export function clamp(n: number, min: number, max: number): number {
    if (min > max) {
        throw new Error("In function clamp: min cannot be greater than max");
    }
    return Math.max(min, Math.min(n, max))
}
export function isInRange(n: number, min: number, max: number): boolean {
    return n >= min && n <= max;
}
/**
 * Rounds towards zero. Be careful dealing with negative numbers.
 * @param n round this number down
 * @param m to the nearest multiple of this number
 */
export function roundTowardsZeroToNearestMultiple(n: number, m: number): number {
    if (m === 0) {
        throw new Error("m cannot be 0"); 
    }
    const mod = n % m;
    return n - mod;
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
export function getAbsolutePointerPosition(ev: PointerEvent | WheelEvent | MouseEvent): Vector2D {
    return new Vector2D(ev.clientX, ev.clientY);
}

/**
 * Calculates and returns the velocity vector needed to get from *fromCoordinate* to *toCoordinate* in *timeFrameInSeconds* seconds
 * @param toCoordinate value in simulation space
 * @param fromCoordinate value in simulation space
 * @param timeFrameInSeconds *optional* defaults to 1
 */
export function calculateVelocityBetweenPoints(toCoordinate: Vector2D , fromCoordinate: Vector2D, timeFrameInSeconds: number = 1): Vector2D {
    if (timeFrameInSeconds <= 0) { timeFrameInSeconds = 1; }
    const distance: Vector2D = toCoordinate.subtract(fromCoordinate);
    return distance.scale(1 / timeFrameInSeconds);
}
/**
 * returns n in hex formatted string, with length >= 2. 
 * @param n number to convert
 */
export function twoDigitHex(n: number) {
    return n.toString(16).padStart(2, "0");
}
//#endregion