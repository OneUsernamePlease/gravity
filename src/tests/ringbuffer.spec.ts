import { expect, test } from "vitest";
import { RingBuffer } from '../scripts/util/ring-buffer.js';

test("RingBuffer add with overflow", () => {
    const buffer: RingBuffer<number> = new RingBuffer(3);
    buffer.add(1);
    buffer.add(2);
    buffer.add(3);
    buffer.add(4);
    const asArray = buffer.toArray();
    expect(asArray).toEqual([2,3,4]);
});
