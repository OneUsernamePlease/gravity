import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { Body2d } from "../scripts/simulation/body2d";
import { Gravity } from "../scripts/simulation/gravity";
import { Vector2D } from "../scripts/util/vector2d";

beforeAll(() => {
    Object.defineProperty(globalThis, "CSS", {
        value: {
            supports: vi.fn(() => true),
        },
    });
});

afterAll(() => {
    vi.restoreAllMocks();
})

test("elastic collision, two bodies, one moving towards other center", ({}) => {
    // using bodies requires some more config...
    const sim = new Gravity();
    const body1 = sim.addObject({body: new Body2d(100), position: new Vector2D(0, 0), velocity: new Vector2D(0, 0), acceleration: new Vector2D(0, 0)}); // stationary
    const body2 = sim.addObject({body: new Body2d(100), position: new Vector2D(0, 0), velocity: new Vector2D(0, 0), acceleration: new Vector2D(0, 0)}); // moving towards body1
});

