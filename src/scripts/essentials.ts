
/*
Just Some functions
(hopefully moderately helpful)
*/
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

//#endregion