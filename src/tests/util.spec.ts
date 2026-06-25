import * as util from "../scripts/util/util";
import { test, expect, describe, vi, afterEach, beforeEach, TestRunner } from "vitest";


describe("rng", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    
    test("minimum number - min, max positive", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);
        expect(util.rng(3, 11)).toBe(3);
    });
    
    test("minimum number - min negative, max positive", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);
        expect(util.rng(-6, 10)).toBe(-6);
    });
    
    test("minimum number - min, max negative", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);
        expect(util.rng(-45, -10)).toBe(-45);
    });
    
    test("maximum number - min, max positive", () => {
        vi.spyOn(Math, "random").mockReturnValue(1 - Number.EPSILON / 2);
        expect(util.rng(3, 11)).toBe(11);
    });
    
    test("maximum number - min negative, max positive", () => {
        vi.spyOn(Math, "random").mockReturnValue(1 - Number.EPSILON / 2);
        expect(util.rng(-6, 10)).toBe(10);
    });

    test("maximum number - min, max negative", () => {
        vi.spyOn(Math, "random").mockReturnValue(1 - Number.EPSILON / 2);
        expect(util.rng(-45, -10)).toBe(-10);
    });
    
    test("min = max", () => {
        expect(util.rng(3, 3)).toBe(3);
    });

    test("min > max", () => {
        expect(() => util.rng(5, 2)).toThrow(Error);
    });
});

describe("roundDownToNearestMultiple", () => {
    test("round positive Number", () => {
        const n = 31.2;
        const m = 5;
        expect(util.roundTowardsZeroToNearestMultiple(n, m)).toEqual(30);
    });

    test("round negative Number", () => {
        const n = -31.2;
        const m = 5;
        expect(util.roundTowardsZeroToNearestMultiple(n, m)).toEqual(-30);
    });

    test("already a multiple", () => {
        const n = 30;
        const m = 5;
        expect(util.roundTowardsZeroToNearestMultiple(n, m)).toBe(30);
    });

    test("decimal multiple", () => {
        const n = 7.8;
        const m = 0.5;
        expect(util.roundTowardsZeroToNearestMultiple(n, m)).toBe(7.5);
    });

    test("negative multiple", () => {
        const n = 31.2;
        const m = -5;
        expect(util.roundTowardsZeroToNearestMultiple(n, m)).toBe(30);
    });

    test("multiple of zero", () => {
        const n = 1;
        const m = 0;
        expect(() => util.roundTowardsZeroToNearestMultiple(n, m)).toThrow(Error);
    });
});

describe("magnitude", () => {
    describe("1-10", () => {
        test("positive", () => {
            expect(util.magnitude(0.2, "1-10")).toEqual(0.1);
            expect(util.magnitude(0.999, "1-10")).toEqual(0.1);
            expect(util.magnitude(593, "1-10")).toEqual(100);
            expect(util.magnitude(1, "1-10")).toEqual(1);
            expect(util.magnitude(100, "1-10")).toEqual(100);
        });
        
        test("negative", () => {
            expect(util.magnitude(-0.02, "1-10")).toEqual(-0.01);
            expect(util.magnitude(-593, "1-10")).toEqual(-100);
            expect(util.magnitude(-1, "1-10")).toEqual(-1);
            expect(util.magnitude(-100, "1-10")).toEqual(-100);
        });

        test("zero", () => {
            expect(util.magnitude(0, "1-10")).toEqual(0);
        });
    });

    describe("1-5-10", () => {
        test("positive", () => {
            expect(util.magnitude(0.2, "1-5-10")).toEqual(0.1);
            expect(util.magnitude(0.999, "1-5-10")).toEqual(0.5);
            expect(util.magnitude(593, "1-5-10")).toEqual(500);
            expect(util.magnitude(1, "1-5-10")).toEqual(1);
            expect(util.magnitude(50, "1-5-10")).toEqual(50);
            expect(util.magnitude(100, "1-5-10")).toEqual(100);
        });
        
        test("negative", () => {
            expect(util.magnitude(-0.2, "1-5-10")).toEqual(-0.1);
            expect(util.magnitude(-0.999, "1-5-10")).toEqual(-0.5);
            expect(util.magnitude(-593, "1-5-10")).toEqual(-500);
            expect(util.magnitude(-1, "1-5-10")).toEqual(-1);
            expect(util.magnitude(-50, "1-5-10")).toEqual(-50);
            expect(util.magnitude(-100, "1-5-10")).toEqual(-100);
        });

        test("zero", () => {
            expect(util.magnitude(0, "1-5-10")).toEqual(0);
        });
    });

    describe("1-2-5-10", () => {
        test("positive", () => {
            expect(util.magnitude(0.12, "1-2-5-10")).toEqual(0.1);
            expect(util.magnitude(0.235, "1-2-5-10")).toEqual(0.2);
            expect(util.magnitude(99, "1-2-5-10")).toEqual(50);
            expect(util.magnitude(593, "1-2-5-10")).toEqual(500);
            expect(util.magnitude(1, "1-2-5-10")).toEqual(1);
            expect(util.magnitude(2, "1-2-5-10")).toEqual(2);
            expect(util.magnitude(50, "1-2-5-10")).toEqual(50);
            expect(util.magnitude(100, "1-2-5-10")).toEqual(100);
        });
        
        test("negative", () => {
            expect(util.magnitude(-0.12, "1-2-5-10")).toEqual(-0.1);
            expect(util.magnitude(-0.235, "1-2-5-10")).toEqual(-0.2);
            expect(util.magnitude(-99, "1-2-5-10")).toEqual(-50);
            expect(util.magnitude(-593, "1-2-5-10")).toEqual(-500);
            expect(util.magnitude(-1, "1-2-5-10")).toEqual(-1);
            expect(util.magnitude(-2, "1-2-5-10")).toEqual(-2);
            expect(util.magnitude(-50, "1-2-5-10")).toEqual(-50);
            expect(util.magnitude(-100, "1-2-5-10")).toEqual(-100);
        });

        test("zero", () => {
            expect(util.magnitude(0, "1-5-10")).toEqual(0);
        });
    });
});

describe("isNumeric", () => {
    describe("valid numeric strings", () => {
        test.each([
            "0",
            "1",
            "-1",
            "123",
            "-123",
            "0.0",
            "1.5",
            "-1.5",
            "999999",
            "3.14159",
            "Infinity",
            "-Infinity",
            ".5",
            "5.",
            "+1",
            "1e4",
            "0x123"
        ])("returns true for '%s'", (input) => {
        expect(util.isNumeric(input)).toBe(true);
        });
    });

    describe("invalid numeric strings", () => {
        test.each([
            "",
            " ",
            "abc",
            "1a",
            "a1",
            "1.2.3",
            "--1",
            "1,000",
            "NaN",
            "++"
        ])("returns false for '%s'", (input) => {
            expect(util.isNumeric(input)).toBe(false);
        });
    });

    describe("other", () => {
        test("trims whitespace", () => {
            expect(util.isNumeric(" 42 ")).toBe(true);
        });
    });
});

describe("decimalToHex", () => {
    test("string input", () => {
        expect(util.decimalToHex("-Infinity")).toEqual("-Infinity");
        expect(util.decimalToHex("-123.123")).toEqual("-7b.1f7ced916874");
        expect(util.decimalToHex("0")).toEqual("0");
        expect(util.decimalToHex("15")).toEqual("f");
        expect(util.decimalToHex("16")).toEqual("10");
    });
    
    test("number input", () => {
        expect(util.decimalToHex(Infinity)).toEqual("Infinity");
        expect(util.decimalToHex(-123.123)).toEqual("-7b.1f7ced916874");
        expect(util.decimalToHex(0)).toEqual("0");
        expect(util.decimalToHex(15)).toEqual("f");
        expect(util.decimalToHex(16)).toEqual("10");
        expect(util.decimalToHex(Math.PI)).toEqual("3.243f6a8885a3");
        expect(util.decimalToHex(1e15)).toEqual("38d7ea4c68000");
    });
    
    test("invalid input", () => {
        expect(() => { util.decimalToHex("nope") }).toThrow(Error);
        expect(() => { util.decimalToHex("") }).toThrow(Error);
    });
    
});

describe("hexToDecimal", () => {
    
});