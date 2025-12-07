import { describe, expect, test } from 'vitest';
import { Vector2D } from '../scripts/util/vector2d';

test('test test', () => {
  expect(true).toBe(true);
});

describe("Vector2D", () => {
    describe("constructor", () => {
        test("default constructor initializes to (0,0)", () => {
            const v = new Vector2D();
            expect(v.x).toBe(0);
            expect(v.y).toBe(0);
        });

        test("constructor with coordinate object", () => {
            const v = new Vector2D({ x: 5, y: -3 });
            expect(v.x).toBe(5);
            expect(v.y).toBe(-3);
        });

        test("constructor with x and y numbers", () => {
            const v = new Vector2D(2, 4);
            expect(v.x).toBe(2);
            expect(v.y).toBe(4);
        });
    });

    describe("toString()", () => {
        test("returns formatted string", () => {
            const v = new Vector2D(3, 7);
            expect(v.toString()).toBe("x: 3, y: 7");
        });
    });

    describe("add()", () => {
        test("adds a single vector", () => {
            const v = new Vector2D(1, 2).add({ x: 3, y: 4 });
            expect(v.x).toBe(4);
            expect(v.y).toBe(6);
        });

        test("adds multiple vectors", () => {
            const v = new Vector2D(1, 1).add(
                { x: 1, y: 1 },
                { x: 2, y: 2 },
                { x: -1, y: 3 }
            );
            expect(v.x).toBe(3);
            expect(v.y).toBe(7);
        });
    });

    describe("subtract()", () => {
        test("subtracts another vector", () => {
            const v = new Vector2D(5, 5).subtract({ x: 2, y: 3 });
            expect(v.x).toBe(3);
            expect(v.y).toBe(2);
        });
    });

    describe("scale()", () => {
        test("scales vector by scalar", () => {
            const v = new Vector2D(2, -3).scale(2);
            expect(v.x).toBe(4);
            expect(v.y).toBe(-6);
        });
    });

    describe("dotProduct()", () => {
        test("computes dot product", () => {
            const v = new Vector2D(3, 4);
            const result = v.dotProduct({ x: -2, y: 5 });
            expect(result).toBe(3 * -2 + 4 * 5);
        });
    });

    describe("magnitude()", () => {
        test("computes magnitude correctly", () => {
            const v = new Vector2D(3, 4);
            expect(v.magnitude()).toBe(5);
        });

        test("magnitude of zero vector is 0", () => {
            const v = new Vector2D(0, 0);
            expect(v.magnitude()).toBe(0);
        });
    });

    describe("normalize()", () => {
        test("normalizes a nonzero vector", () => {
            const v = new Vector2D(3, 4).normalize();
            expect(v.x).toBeCloseTo(3 / 5);
            expect(v.y).toBeCloseTo(4 / 5);
        });

        test("normalizing zero vector returns (0,0)", () => {
            const v = new Vector2D(0, 0).normalize();
            expect(v.x).toBe(0);
            expect(v.y).toBe(0);
        });
    });

    describe("distance()", () => {
        test("computes distance to another vector", () => {
            const v = new Vector2D(1, 1);
            const d = v.distance({ x: 4, y: 5 });
            expect(d).toBe(5);
        });

        test("distance to same point is 0", () => {
            const v = new Vector2D(5, 5);
            expect(v.distance({ x: 5, y: 5 })).toBe(0);
        });
    });
    
    describe("linesIntersecting()", () => {
        test("horizontal colinear line segments partial intersection (strict) - returns intersection line endpoints", () => {
            const line1Start = new Vector2D(0,0);
            const line1End = new Vector2D(10,0);
            const line2Start = new Vector2D(9,0);
            const line2End = new Vector2D(15,0);
            
            const result = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], true);
            expect(result).toEqual([{ x: 9, y: 0 }, { x: 10, y: 0 }]);
        });
        test("horizontal colinear line segments partial intersection (not strict) - returns line1", () => {
            const line1Start = new Vector2D(0,0);
            const line1End = new Vector2D(10,0);
            const line2Start = new Vector2D(9,0);
            const line2End = new Vector2D(15,0);
            
            const result = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], false);
            expect(result).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
        });
        test("horizontal colinear line segments partial intersection at one point(strict) - returns intersection point", () => {
            const line1Start = new Vector2D(0,0);
            const line1End = new Vector2D(10,0);
            const line2Start = new Vector2D(10,0);
            const line2End = new Vector2D(15,0);
            
            const result = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], true);
            expect(result).toEqual({ x: 10, y: 0 });
        });
        test("horizontal and vertical line segments intersection outside of strict bounds (strict) - returns null", () => {
            const line1Start = new Vector2D(0,0);
            const line1End = new Vector2D(10,0);
            const line2Start = new Vector2D(12,10);
            const line2End = new Vector2D(12,-10);
            
            const result = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], true);
            expect(result).toEqual(null);
        });
        test("horizontal and vertical line segments intersection inside of strict bounds (strict) - returns intersection point", () => {
            const line1Start = new Vector2D(0,0);
            const line1End = new Vector2D(10,0);
            const line2Start = new Vector2D(5,10);
            const line2End = new Vector2D(5,-10);
            
            const result = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], true);
            expect(result).toEqual({ x: 5, y: 0 });
        });
        test("horizontal and vertical line segments intersection outside of strict bounds (non-strict) - returns intersection point", () => {
            const line1Start = new Vector2D(0,0);
            const line1End = new Vector2D(10,0);
            const line2Start = new Vector2D(12,10);
            const line2End = new Vector2D(12,-10);
            
            const result = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], false);
            expect(result).toEqual({ x: 12, y: 0 });
        });
        test("parallel line segments intersection (strict and not strict) - returns null", () => {
            const line1Start = new Vector2D(0,0);
            const line1End = new Vector2D(1,2);
            const line2Start = new Vector2D(3,1.5);
            const line2End = new Vector2D(1.5,-1.5);
            
            const resultNotStrict = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], false);
            const resultStrict = Vector2D.linesIntersecting([line1Start, line1End], [line2Start, line2End], true);
            expect(resultNotStrict).toEqual(null);
            expect(resultStrict).toEqual(null);
        });
    });
});