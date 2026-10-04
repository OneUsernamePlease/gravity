import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { Body2d } from "../scripts/simulation/body2d";
import { Vector2D } from "../scripts/util/vector2d";
import { Physics } from  "../scripts/simulation/physics";
import { ObjectState } from "../scripts/types/types";

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

test.describe("force calculations", () => {
    const exponents = [1,2,3,4,5];

    test.each(exponents)("force stays the same when changing the exponent for r - exponent: %s", (exponent) => {
        const referenceDistance = 100;
        const body1: Body2d = new Body2d(1000);
        const body2: Body2d = new Body2d(1000);
        const zeroVector = new Vector2D();
        const g = 50;
        const lowerBounds = 1;
        const objectState1: ObjectState = {
            body: body1,
            position: zeroVector,
            acceleration: zeroVector,
            velocity: zeroVector
        }
        const objectState2: ObjectState = {
            body: body2,
            position: zeroVector.add(new Vector2D(referenceDistance, 0)),
            acceleration: zeroVector,
            velocity: zeroVector
        }

        const expectedForce: Vector2D = Physics.calculateGravitationalForceBetweenBodies(objectState1, objectState2, g, lowerBounds, 2, referenceDistance);
        const actualForce: Vector2D = Physics.calculateGravitationalForceBetweenBodies(objectState1, objectState2, g, lowerBounds, exponent, referenceDistance);
        expect(actualForce.equals(expectedForce), `exponent ${exponent} resulted in a different force.`).toBeTruthy();
        console.log(`expected: ${expectedForce.toString()}; received: ${actualForce.toString()}`)
    })
});
