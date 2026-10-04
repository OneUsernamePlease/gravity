import { ObjectState } from "@/types/types.js";
import { Vector2D } from "@/util/vector2d.js";

export namespace Physics {
    /**
     * Calculates the force-vector between the bodies with the given ids
     * @param objectState1 objectState of body1
     * @param objectState2 objectState of body2
     * @param g reference gravitational constant aka "strength"
     * @param gravityLowerBounds force calculation for distances lower than this, use the force at this distance. Ensures forces don't grow too big.
     * @param gravityExponent the exponent applied to the distance between the bodies. Ie.: G * (m1*m2 / r^exponent)
     * @param gravityReferenceDistance 
     * @returns a vector representing the force applied ***to*** body with id i
     */
    export function calculateGravitationalForceBetweenBodies (
        // REFACTOR ME: ObjectState has too much info, we just need position and mass.
        objectState1: ObjectState,
        objectState2: ObjectState,
        g: number,
        gravityLowerBounds: number,
        gravityRadiusExponent: number,
        gravityReferenceDistance: number
    ): Vector2D {

        // Don't let the force grow too big
        const distance = Math.max(objectState1.position.distance(objectState2.position), gravityLowerBounds);

        // Aright, now it's getting complicated (moderately complicated, not as tough as it looks). I really don't want to forget what i did here.
        // Allowing to change the exponent drastically changes how the simulation feels.
        // Therefore, when changing the exponent, we want to also change G to compensate for that.
        // We calculate G in such a way, that the force between two bodies, exactly the referenceDistance apart, remains unchanged.
        // Here's some math for nobody, maybe my future self. Cannot imagine anyone to actually read (and try to understand) this (except for myself, in the future).
        // "Normally" we have: F = G * ( (m1 * m2) / (r**2) )
        // How does changing the exponent (r**2) => (r**n) change G such that F remains the same (given the reference distance)?
        // Gn * (m1 * m2) / r**n = G2 * (m1 * m2) / r**2 - set the two versions equal, and solve for Gn (which is the new G with r's exponent n; G2 is G with r's exponent 2).
        // Solving (cancel the masses, multiply by r**n, simplify) we get: Gn = G2 * r**(n-2)
        const effectiveG = g * Math.pow(gravityReferenceDistance, gravityRadiusExponent - 2);

        // use effectiveG or this._g to toggle whether the G-compensation should be activated.
        // Oh yeah, and: REFACTOR ME, thats not a good way to toggle.
        const netForceBetweenBodies: number = effectiveG * ((objectState1.body.mass * objectState2.body.mass)/Math.pow(distance, gravityRadiusExponent));
        const unitVectorIToJ = objectState2.position.subtract(objectState1.position).normalize();
        return unitVectorIToJ.scale(netForceBetweenBodies);
    }
}