import { ObjectState, SimulationSettings } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import * as c from "../const/const.js";
import { SimulationAPI } from "../types/apis.js";
import { clamp } from "../util/util.js";
import { SimplePerformance } from "../util/simple-performance.js";

export class Gravity implements SimulationAPI {
    private _simulationState: Map<number, ObjectState>;
    private _nextId: number = 0;
    private _running: boolean;
    private _tickCount: number;
    private _tickLength: number;
    private _collisionDetection: boolean;
    private _elasticCollisions: boolean;
    private _g: number; // gravitational constant
    private _performance: SimplePerformance = new SimplePerformance();
    private readonly gravityLowerBounds: number = 1; // force calculations for distances lower than this number are skipped
    private _cachedIds: number[] = [];
//#region get, set
    get simulationState() {
        return this._simulationState;
    }
    get tick() {
        return this._tickCount;
    }
    get running() {
        return this._running;
    }
    get collisionSettings(): { collisionDetection: boolean, elastic: boolean } {
        return { collisionDetection: this._collisionDetection, elastic: this._elasticCollisions };
    }
    get g(): number {
        return this._g;
    }

    /**
     * Total time the simulation has been running for in milliseconds. Does not increase while the simulation is stopped.
     */
    get totalTime(): number {
        return this._performance.elapsed;
    }
    get ticksLastSecond() {
        return this._performance.measurementsLastInterval;
    }
    get averageTicksPerSecond() {
        if (this.totalTime === 0) return 0;
        const elapsedSeconds = this.totalTime / 1000;
        return this._tickCount / elapsedSeconds;
    }

    private set g(newG: number) {
        this._g = clamp(newG, c.MIN_G, c.MAX_G);
    }
    private set collisionDetection(collisionDetection: boolean) {
        this._collisionDetection = collisionDetection;
    }
    private set elasticCollisions(elastic: boolean) {
        this._elasticCollisions = elastic;
    }
// #endregion
    constructor() { 
        this._simulationState = new Map();
        this._nextId = 0;
        this._running = false;
        this._tickCount = 0;
        this._tickLength = 10; // ms
        this._collisionDetection = false;
        this._elasticCollisions = false;
        this._g = c.DEFAULT_G;
        this._cachedIds = [];
    }
    applySettings(settings: SimulationSettings): void {
        if (settings.collisionDetection !== undefined)       this.collisionDetection = settings.collisionDetection;
        if (settings.elasticCollisions !== undefined)        this.elasticCollisions = settings.elasticCollisions;
        if (settings.gravitationalConstant !== undefined)    this.g = settings.gravitationalConstant;
    }
    addObject(objectState: ObjectState): number  {
        if (!objectState.body.movable) {
            objectState.velocity = new Vector2D(0, 0);
        }
        const id = this._nextId++;
        this.simulationState.set(id, objectState);
        this._cachedIds = Array.from(this.simulationState.keys());
        return this.simulationState.size;
    }
    stop() {
        this._running = false;

        this._performance.stop();
        this._performance.reset();
    }
    run() {
        if (this._running) {
            return;
        }
        this._running = true;

        this._performance.start();
        
        const runSimulationStep = () => {
            if (this._running) {
                setTimeout(runSimulationStep, this._tickLength);
                this.advanceTick();
            }
        };
        
        runSimulationStep();
    }
    reset() {
        this.clearObjects();
        this._tickCount = 0;
        this._performance.reset();
    }
    advanceTick() {
        this.updateAccelerationVectors();
        this.updateVelocitiesAndPositions();
        if (this._collisionDetection) {
            this.handleCollisions();
        }

        this._performance.measure();

        this._tickCount++;
    }
    private clearObjects() {
        this._simulationState.clear();
        this._nextId = 0;
        this._cachedIds = [];
    }
    private removeFromObjectStates(id: number) {
        this.simulationState.delete(id);
        this._cachedIds = Array.from(this.simulationState.keys());
    }
    private updateAccelerationVectors() {
        const forces: Map<number, Vector2D> = this.calculateForces();

        this.simulationState.forEach((objectState, id) => {
            const totalForceOnBody = forces.get(id) || (new Vector2D(0, 0));
            const newAcceleration = totalForceOnBody.scale(1 / objectState.body.mass);
            objectState.acceleration = newAcceleration;
        });
    }
    private calculateForces() {
        const forces: Map<number, Vector2D> = new Map();
        const ids = this._cachedIds;
        
        for (let i = 0; i < ids.length; i++) {
            const idI = ids[i];
            for (let j = i+1; j < ids.length; j++) {
                const idJ = ids[j];
                const forceOnI = this.calculateForceBetweenBodies(idI, idJ);
                const forceOnJ = forceOnI.scale(-1);

                forces.set(idI, (forces.get(idI) || new Vector2D(0, 0)).add(forceOnI));
                forces.set(idJ, (forces.get(idJ) || new Vector2D(0, 0)).add(forceOnJ));
            }
        }
        return forces;
    }
    /**
     * Calculates the next **position** and **velocity** of the object in state, and updates objectState accordingly.
     * @param objectState *ObjectState* containing the body
     */
    private updateVelocityAndPosition(objectState: ObjectState) {
        const dt = this._tickLength / 1000;
        if (!objectState.body.movable) { return; }
        objectState.velocity = objectState.velocity.add(objectState.acceleration.scale(dt));
        objectState.position = objectState.position.add(objectState.velocity.scale(dt));
    }
    private updateVelocitiesAndPositions() {
        this.simulationState.forEach(objectState => {
            this.updateVelocityAndPosition(objectState)
        });
    }
    /**
     * Calculates the force-vector between the bodies with the given ids
     * @returns a vector representing the force applied ***to*** body with id i
     */
    private calculateForceBetweenBodies(idI: number, idJ: number): Vector2D {
        const objectStateI = this.simulationState.get(idI)!;
        const objectStateJ = this.simulationState.get(idJ)!;

        const distance = objectStateI.position.distance(objectStateJ.position);
        if (distance < this.gravityLowerBounds || distance === 0) // if the bodies are too close, skip the calculation
            { return new Vector2D(0, 0); } 
        const netForceBetweenBodies: number = this._g * ((objectStateI.body.mass * objectStateJ.body.mass)/(distance * distance));
        const unitVectorIToJ = objectStateJ.position.subtract(objectStateI.position).normalize();
        return unitVectorIToJ.scale(netForceBetweenBodies);
    }
    private handleCollisions() {
        const ids = this._cachedIds;
        for (let i = 0; i < ids.length; i++) {
            const idI = ids[i];
            const objectStateI = this.simulationState.get(idI);
            if (!objectStateI) {
                continue; // elements in ids shift as bodies merge. just incrementing does not account for that
            }
            for (let j = i+1; j < ids.length; j++) {
                const idJ = ids[j];
                const objectStateJ = this.simulationState.get(idJ);
                if (!objectStateJ) {
                    continue; // ...still works in >99% of cases (collision last >1 frame). but it's not nice.
                }
                const distanceIJ = objectStateI.position.distance(objectStateJ.position);
                const collision = distanceIJ <= objectStateI.body.radius + objectStateJ.body.radius;
                if (collision) {
                    if (distanceIJ <= objectStateI.body.radius || distanceIJ <= objectStateJ.body.radius) { 
                        this.mergeBodies(idI, idJ);
                    } else if (this._elasticCollisions) {
                        this.elasticCollision(objectStateI, objectStateJ);
                    }
                }
            }
        }
    }
    /**
     * Merges the two bodies with the given ids into one. The lighter body is merged into the heavier one. Momentum is preserved.
     */
    private mergeBodies(id1: number, id2: number) {
        const state1: ObjectState = this.simulationState.get(id1)!;
        const state2: ObjectState = this.simulationState.get(id2)!;
        const totalMomentum = state1.velocity.scale(state1.body.mass).add(state2.velocity.scale(state2.body.mass));
        const totalMass = state1.body.mass + state2.body.mass;
        const resultingVelocity = totalMomentum.scale(1 / totalMass);
        let changeObject: ObjectState;
        let removeId: number;

        if (state2.body.mass > state1.body.mass) {
            changeObject = state2;
            removeId = id1;
        } else {
            changeObject = state1;
            removeId = id2;
        }
        changeObject.velocity = resultingVelocity;
        changeObject.body.setProperties(totalMass);
        
        changeObject.body.movable = (state1.body.movable && state2.body.movable);
        if (!changeObject.body.movable) {
            changeObject.velocity = new Vector2D(0, 0);
        }
        this.removeFromObjectStates(removeId);
    }
    /**
    * @param restitution number between 0 (perfectly inelastic) and 1 (perfectly elastic)
    */
    private elasticCollision(body1: ObjectState, body2: ObjectState, restitution: number = 1) {
        const lowerBounds = 1;

        // normal vector between the bodies
        const displacement = body1.position.displacementVector(body2.position);
        const distance = displacement.magnitude(); 
        if (distance <= lowerBounds || distance === 0) {
            return; 
        }
        const normalizedDisplacement = displacement.scale(1 / distance);

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
    private placeBodiesTangentially(objectState1: ObjectState, objectState2: ObjectState) {
        const displacement = objectState1.position.displacementVector(objectState2.position);
        const displacementMag = displacement.magnitude()
        if (displacementMag === 0) {
            return;
        }
        const normalDisplacement = displacement.normalize();        
        const targetDistance = objectState1.body.radius + objectState2.body.radius;
        if (targetDistance === 0) {
            return;
        }
        const totalMoveDistance = targetDistance - displacementMag;
        const invMass1 = 1 / objectState1.body.mass;
        const invMass2 = 1 / objectState2.body.mass;

        const totalInvMass = invMass1 + invMass2;

        const moveBody1 = normalDisplacement.scale(
            totalMoveDistance * invMass1 / totalInvMass
        );

        const moveBody2 = normalDisplacement.scale(
            totalMoveDistance * invMass2 / totalInvMass
        );

        objectState1.position = objectState1.position.subtract(moveBody1);
        objectState2.position = objectState2.position.add(moveBody2);
    }
}
