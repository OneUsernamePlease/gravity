import { ObjectState } from "@/types/types.js";
import { Vector2D } from "@/util/vector2d.js";

export namespace Physics {
    interface BodyMassPosition {
        position: Vector2D;
        body: {
            mass: number;
        }
    }
    /**
     * Calculates the force-vector between the bodies with the given ids
     * @param objectState1 objectState of body1
     * @param objectState2 objectState of body2
     * @param g reference gravitational constant aka "strength"
     * @param gravityLowerBounds force calculation for distances lower than this, use the force at this distance. Ensures forces don't grow too big.
     * @param gravityExponent the exponent applied to the distance between the bodies. Ie.: G * (m1*m2 / r^exponent)
     * @param gravityReferenceDistance 
     * @returns a vector representing the force applied ***to*** body1 (of objectState1)
     */
    export function gravitationalForceBetweenBodies (
        objectState1: BodyMassPosition,
        objectState2: BodyMassPosition,
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
    /**
    * @param restitution number between 0 (perfectly inelastic) and 1 (perfectly elastic)
    */
    export function elasticCollision(body1: ObjectState, body2: ObjectState, restitution: number = 1) {
        // normal vector between the bodies
        const displacement = body1.position.displacementVector(body2.position);
        const normalizedDisplacement = displacement.normalize();

        // relative velocity along the normalDisplacement?
        const relativeVelocity = body2.velocity.subtract(body1.velocity);
        const velocityAlongDisplacement = relativeVelocity.dotProduct(normalizedDisplacement);

        // if the bodies are moving apart, do nothing
        if (velocityAlongDisplacement > 0) { return; }

        const invMass1 = body1.body.movable ? 1 / body1.body.mass : 0;
        const invMass2 = body2.body.movable ? 1 / body2.body.mass : 0;

        // impulseScalar = change in momentum as scalar
        const impulseScalar = -(1 + restitution) * velocityAlongDisplacement / (invMass1 + invMass2);

        const impulse = normalizedDisplacement.scale(impulseScalar);

        // update velocities based on the impulse scalar
        const deltaV1 = impulse.scale(invMass1);
        const deltaV2 = impulse.scale(invMass2);
        body1.velocity = body1.velocity.subtract(deltaV1);
        body2.velocity = body2.velocity.add(deltaV2);
    }
}
