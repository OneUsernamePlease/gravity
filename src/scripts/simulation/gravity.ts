import { ObjectState, SimulationSettings } from "../types/types";
import { Vector2D } from "../util/vector2d";
import * as c from "../const/const";
import { SimulationAPI } from "../types/apis";
import { clamp } from "../util/util";
import { Body2d } from "./body2d";


export class Gravity implements SimulationAPI {
    private _simulationState: ObjectState[]; // Insertion Order is not preserved (bc we delete bodies using swap & pop). Switch to map at some point
    private _running: boolean;
    private _tickCount: number;
    private _tickLength: number;
    private _collisionDetection: boolean;
    private _elasticCollisions: boolean;
    private _g: number; // gravitational constant
    private readonly gravityLowerBounds: number = 1; // force calculations for distances lower than this number are skipped
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
        this._simulationState = [];
        this._running = false;
        this._tickCount = 0;
        this._tickLength = 10; // ms
        this._collisionDetection = false;
        this._elasticCollisions = false;
        this._g = c.DEFAULT_G;
    }
    public applySettings(settings: SimulationSettings): void {
        if (settings.collisionDetection != undefined)       this.collisionDetection = settings.collisionDetection;
        if (settings.elasticCollisions != undefined)        this.elasticCollisions = settings.elasticCollisions;
        if (settings.gravitationalConstant != undefined)    this.g = settings.gravitationalConstant;
    }
    public addBody(body: Body2d, position: Vector2D, velocity: Vector2D): number {

        const objectState = { body, position, velocity,  acceleration: new Vector2D(0, 0)};
        if (!body.movable) {
            objectState.velocity = new Vector2D(0, 0);
        }
        return this.addObject(objectState);
    }
    public stop() {
        this._running = false;
    }
    public run() {
        if (this._running) {
            return;
        }
        this._running = true;

        const runSimulationStep = () => {
            if (this._running) {
                setTimeout(runSimulationStep, this._tickLength);
                this.advanceTick();
            }
        };
        runSimulationStep();
    }
    public reset() {
        this.clearObjects();
        this._tickCount = 0;
    }
    public advanceTick() {
        this.updateAccelerationVectors();
        this.updateVelocitiesAndPositions();
        if (this._collisionDetection) {
            this.handleCollisions();
        }
        this._tickCount++;
    }    
    private addObject(objectState: ObjectState): number  {
        if (!objectState.body.movable) {
            objectState.velocity = new Vector2D(0, 0);
        }
        return this.simulationState.push(objectState);
    }
    private clearObjects() {
        this._simulationState = [];
    }
    private removeFromObjectStates(index: number) {
        this.simulationState[index] = this.simulationState[this.simulationState.length - 1];
        this.simulationState.pop();
    }
    private updateAccelerationVectors() {
        const forces: Map<number, Vector2D> = this.calculateForces();

        this.simulationState.forEach((objectState, index) => {
            const totalForceOnBody = forces.get(index) || (new Vector2D(0, 0));
            const newAcceleration = totalForceOnBody.scale(1 / objectState.body.mass);
            objectState.acceleration = newAcceleration;
        });
    }
    private calculateForces() {
        const forces: Map<number, Vector2D> = new Map();
        
        for (let i = 0; i < this.simulationState.length; i++) {
            for (let j = i+1; j < this.simulationState.length; j++) {
                const forceOnI = this.calculateForceBetweenBodies(i, j);
                const forceOnJ = forceOnI.scale(-1);

                forces.set(i, (forces.get(i) || new Vector2D(0, 0)).add(forceOnI));
                forces.set(j, (forces.get(j) || new Vector2D(0, 0)).add(forceOnJ));
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
     * Calculates the force-vector between the bodies in objectStates at index [i] and [j]
     * @returns a vector representing the force applied ***to*** body at ***objectStates[i]***
     */
    private calculateForceBetweenBodies(i: number, j: number): Vector2D {
        const objectStateI = this.simulationState[i];
        const objectStateJ = this.simulationState[j];

        const distance = objectStateI.position.distance(objectStateJ.position);
        if (distance < this.gravityLowerBounds || distance === 0) // if the bodies are too close, skip the calculation
            { return new Vector2D(0, 0); } 
        const netForceBetweenBodies: number = this._g * ((objectStateI.body.mass * objectStateJ.body.mass)/(distance * distance));
        const unitVectorIToJ = objectStateJ.position.subtract(objectStateI.position).normalize();
        return unitVectorIToJ.scale(netForceBetweenBodies);
    }
    private handleCollisions() {
        for (let i = 0; i < this.simulationState.length; i++) {
            const objectStateI = this.simulationState[i];
            for (let j = i+1; j < this.simulationState.length; j++) {
                const objectStateJ = this.simulationState[j];
                const distanceIJ = objectStateI.position.distance(objectStateJ.position);
                const collision = distanceIJ <= objectStateI.body.radius + objectStateJ.body.radius;
                if (collision) {
                    if (distanceIJ <= objectStateI.body.radius || distanceIJ <= objectStateJ.body.radius) { 
                        this.mergeBodies(i, j);
                    } else if (this._elasticCollisions) {
                        this.elasticCollision(objectStateI, objectStateJ);
                    }
                }
            }
        }
    }
    /**
     * Merges the two bodies at indices in objectStates into one. The lighter body is merged into the heavier one. Momentum is preserved.
     */
    private mergeBodies(index1: number, index2: number) {
        const state1: ObjectState = this.simulationState[index1];
        const state2: ObjectState = this.simulationState[index2];
        const totalMomentum = state1.velocity.scale(state1.body.mass).add(state2.velocity.scale(state2.body.mass));
        const totalMass = state1.body.mass + state2.body.mass;
        const resultingVelocity = totalMomentum.scale(1 / totalMass);
        let changeObject: ObjectState;
        let removeIndex: number;

        if (state2.body.mass > state1.body.mass) {
            changeObject = state2;
            removeIndex = index1;
        } else {
            changeObject = state1;
            removeIndex = index2;
        }
        changeObject.velocity = resultingVelocity;
        changeObject.body.setProperties(totalMass);
        
        changeObject.body.movable = (state1.body.movable && state2.body.movable);
        if (!changeObject.body.movable) {
            changeObject.velocity = new Vector2D(0, 0);
        }
        this.removeFromObjectStates(removeIndex);
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

        // impulseScalar = change in momentum as scalar
        const impulseScalar = -(1 + restitution) * velocityAlongDisplacement / (body1.body.mass + body2.body.mass);

        // update velocities based on the impulse scalar
        const deltaV1 = normalizedDisplacement.scale(impulseScalar * body2.body.mass);
        const deltaV2 = normalizedDisplacement.scale(impulseScalar * body1.body.mass);
        body1.velocity = body1.velocity.subtract(deltaV1);
        body2.velocity = body2.velocity.add(deltaV2);
        
        // REFACTOR ME: at the top, check for movable, if not just reflect velocity
        // if a body is immovable, reset its velocity and transfer it back
        if (!body1.body.movable) {
            body1.velocity = new Vector2D(0, 0);
            body2.velocity = body2.velocity.add(deltaV1);
        }
        if (!body2.body.movable) {
            body2.velocity = new Vector2D(0, 0);
            body1.velocity = body1.velocity.add(deltaV2);
        }
    }
    private placeBodiesTangentially(objectState1: ObjectState, objectState2: ObjectState) {
        const displacement = objectState1.position.displacementVector(objectState2.position);
        const normalDisplacement = displacement.normalize();        
        const targetDistance = objectState1.body.radius + objectState2.body.radius;
        const totalMoveDistance = targetDistance - displacement.magnitude();
        if (targetDistance === 0) {
            return;
        }
        const moveBody1 = normalDisplacement.scale(totalMoveDistance * (objectState1.body.radius / targetDistance));
        const moveBody2 = normalDisplacement.scale(totalMoveDistance * (objectState2.body.radius / targetDistance));
    
        objectState1.position = objectState1.position.subtract(moveBody1);
        objectState2.position = objectState2.position.add(moveBody2);
    }
}
