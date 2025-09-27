import { expect, test } from 'vitest';
import { Vector2D } from '../scripts/vector2d';

test('test test', () => {
  expect(true).toBe(true);
});

test("horizontal colinear line segments partial intersection (strict) - returns intersecting line endpoint", () => {
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