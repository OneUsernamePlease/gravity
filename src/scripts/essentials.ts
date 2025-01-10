
    /*
    Just Some functions
    (hopefully moderately helpful)
    */
    
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
     * ensures min <= n <= max (Inclusive!)
     * @param n number to test against upper and lower bounds
     * @param min the lowest allowed value for n
     * @param max the highest allowed value for n
     * @returns n if n satisfies min <= n <= max, otherwise min or max are returned
     */
    export function ensureNumberInRange(n: number, min: number, max: number): number {
        return Math.max(min, Math.min(n, max))
    }
    //#endregion
    
    //#region string stuff
    /**
     * Removes all occurrences of charToRemove from the beginning of str
     * @param str the string to be modified
     * @param charToRemove ***optional*** If no value is provided the first character of str is used.
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
    export function getInputValue(inputId: string): string {
        let input = document.getElementById(inputId);
        return (input instanceof HTMLInputElement) ? (input as HTMLInputElement).value.trim() : "";
    }
    /**
     * @param inputId elementID for input-element
     * @returns element's value attribute; 0 if value is not numeric
     */
    export function getInputNumber(inputId: string): number {
        let inputValue: string = getInputValue(inputId);
        return isNumeric(inputValue) ? +inputValue : 0;
    }
    export function isChecked(inputId: string): boolean {
        const checkbox = document.getElementById(inputId) as HTMLInputElement;
        return checkbox ? checkbox.checked : false;
    }
    //#endregion