import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { Body2d } from "../scripts/simulation/body2d";
import { Vector2D } from "../scripts/util/vector2d";
import { Physics } from  "../scripts/simulation/physics";

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

test.describe("Gravitational Force Between Bodies", () => {
    const exponents = [1,3,4,5];

    test.each(exponents)("force stays the same when changing the exponent for r - exponent: %s", (exponent) => {
        const referenceDistance = 100;
        const mass = 1000;
        const zeroVector = new Vector2D();
        const g = 50;
        const lowerBounds = 1;
        const body1 = {
            mass,
            position: zeroVector,
        }
        const body2 = {
            mass,
            position: zeroVector.add(new Vector2D(referenceDistance, 0)),
        }

        const expectedForce: Vector2D = Physics.gravitationalForceBetweenBodies(body1, body2, g, lowerBounds, 2, referenceDistance);
        const actualForce: Vector2D = Physics.gravitationalForceBetweenBodies(body1, body2, g, lowerBounds, exponent, referenceDistance);
        expect(actualForce, `exponent ${exponent} resulted in a different force.`).toEqual(expectedForce);
    })
});

test.describe("Elastic Collision", () => {
    test.describe("perfectly elastic", () => {
        const restitution = 1;

        test("Two bodies, tangential, same mass, moving body straight on hits stationary body", () => {
            const mass = 1000;
            const radius = 20;
            const movingBodyVelocity = new Vector2D(-100, 0);
            const zeroVector = new Vector2D(0, 0)
            // stationary
            const objectState1 = {
                body: new Body2d(mass, { radius }),
                position: zeroVector,
                velocity: zeroVector,
                acceleration: zeroVector
            };
            // moving towards body1
            const objectState2 = {
                body: new Body2d(mass, { radius }),
                position: new Vector2D(2 * radius, 0),
                velocity: movingBodyVelocity,
                acceleration: zeroVector
            }; 
    
            Physics.elasticCollision(objectState1, objectState2, restitution);

            expect(objectState1.velocity, `collision was not perfectly elastic`).toEqual(movingBodyVelocity);
            expect(objectState2.velocity, `collision was not perfectly elastic`).toEqual(zeroVector);
        });

        test("Two bodies, slight overlap, same mass, moving body straight on hits stationary body", () => {
            const mass = 1000;
            const radius = 20;
            const movingBodyVelocity = new Vector2D(-100, 0);
            const zeroVector = new Vector2D(0, 0)
            // stationary
            const objectState1 = {
                body: new Body2d(mass, { radius }),
                position: zeroVector,
                velocity: zeroVector,
                acceleration: zeroVector
            };
            // moving towards body1
            const objectState2 = {
                body: new Body2d(mass, { radius }),
                position: new Vector2D(1.8 * radius, 0),
                velocity: movingBodyVelocity,
                acceleration: zeroVector
            }; 
    
            Physics.elasticCollision(objectState1, objectState2, restitution);

            expect(objectState1.velocity, `collision was not perfectly elastic`).toEqual(movingBodyVelocity);
            expect(objectState2.velocity, `collision was not perfectly elastic`).toEqual(zeroVector);
        });

        
    });

    test.describe("perfectly inelastic", () => {
        const restitution = 0;

        test("Two bodies, tangential, same mass, moving body straight on hits stationary body", () => {
            const mass = 1000;
            const radius = 20;
            const movingBodyVelocity = new Vector2D(-100, 0);
            const zeroVector = new Vector2D(0, 0)
            // stationary
            const objectState1 = {
                body: new Body2d(mass, { radius }),
                position: zeroVector,
                velocity: zeroVector,
                acceleration: zeroVector
            };
            // moving towards body1
            const objectState2 = {
                body: new Body2d(mass, { radius }),
                position: new Vector2D(2 * radius, 0),
                velocity: movingBodyVelocity,
                acceleration: zeroVector
            }; 
    
            Physics.elasticCollision(objectState1, objectState2, restitution);

            expect(objectState1.velocity, `collision was not perfectly elastic. velocity1: ${objectState1.velocity}`).toEqual(movingBodyVelocity.scale(0.5));
            expect(objectState2.velocity, `collision was not perfectly elastic. velocity2: ${objectState2.velocity}`).toEqual(movingBodyVelocity.scale(0.5));
        });        
    });

})


