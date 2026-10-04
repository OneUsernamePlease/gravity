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


