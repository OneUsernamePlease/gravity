import { ObjectState } from "./types";
import { Vector2D } from "./vector2d"
export class Body2d {
    private _mass!: number;
    private _radius!: number;
    private _color!: string;
    private _movable!: boolean;
    static defaultDensity = 1;

    // #region constructor, get, set
    constructor(mass: number, movable?: boolean, color?: string, radius?: number)  {
        this.mass = mass;
        if (radius === undefined) { radius = this.defaultRadius(mass); }
        this.radius = radius;
        if (color === undefined) { color = "white"; }
        this.color = color;
        if (movable === undefined) { movable = true; }
        this.movable = movable;     
    }
    public get mass() {
        return this._mass;
    }
    public set mass(newMass: number) {
        this._mass = newMass;
    }
    public get radius() {
        return this._radius;
    }
    public set radius(newRadius: number) {
        this._radius = newRadius;
    }
    public get movable() {
        return this._movable;
    }
    public set movable(affected: boolean) {
        this._movable = affected
    }   
    public get color() : string {
        return this._color
    }
    public set color(c: string) {
        if (!(CSS.supports("color", c))) {
            c = "white";
        }
        this._color = c;
    } 
    // #endregion
    /**
     * sets the radius based on mass and density
     */
    public defaultRadius(mass?: number) {
        if (mass === undefined) {
            mass = this.mass;
        }
        return ((3 * mass)/(4 * Math.PI * Body2d.defaultDensity)) ** (1/3); 
    }
}
export class Simulation {
    private _objectStates: ObjectState[];
    public _running: boolean;
    public _tickCount: number;
    private _tickLength: number;
    private _collisionDetection: boolean;
    private _elasticCollisions: boolean;
    private _g: number; // gravitational constant
    private readonly gravityLowerBounds: number = 1; // force calculations for distances lower than this number are skipped
    constructor() { 
        this._objectStates = [];
        this._running = false;
        this._tickCount = 0;
        this._tickLength = 10; // ms
        this._collisionDetection = false;
        this._elasticCollisions = false;
        this._g = 50;
    }
    // #region get, set
    public get objectStates() {
        return this._objectStates;
    }
    public set objectStates(objectState: ObjectState[]) {
        this._objectStates = objectState;
    }
    public get running() {
        return this._running;
    }
    public set running(running: boolean) {
        this._running = running;
    }
    public get tickCount() {
        return this._tickCount;
    }
    public set tickCount(tickCount: number) {
        this._tickCount = tickCount;
    }
    public get tickLength() {
        return this._tickLength;
    }
    public set tickLength(t: number) {
        this._tickLength = t;
    }
    public get collisionDetection() {
        return this._collisionDetection;
    }
    public set collisionDetection(collisionDetection: boolean) {
        this._collisionDetection = collisionDetection;
    }
    public get elasticCollisions() {
        return this._elasticCollisions;
    }
    public set elasticCollisions(elasticCollisions: boolean) {
        this._elasticCollisions = elasticCollisions;
    }
    public get g() {
        return this._g;
    }
    public set g(g: number) {
        this._g = g;
    }
// #endregion
    public addObject(objectState: ObjectState): number {
        if (!objectState.body.movable) {
            objectState.velocity = new Vector2D(0, 0);
        }
        return this.objectStates.push(objectState);
    }
    public clearObjects() {
        this.objectStates = [];
    }
    public removeFromObjectStates(i: number) {
        this.objectStates.splice(i, 1);
    }
    public pause() {
        this.running = false;
    }
    public nextState() {
        // calculate new accelerations vectors and update objectStates accordingly
        this.updateAccelerationVectors();
        
        // update position and velocity arising therefrom
        this.objectStates.forEach(objectState => {
            this.updateVelocityAndPosition(objectState)
        });

        if (this.collisionDetection) {
            this.handleCollisions();
        }
        
        this.tickCount++;
    }
    private updateAccelerationVectors() {
        const forces: Map<number, Vector2D> = this.calculateForces();

        this.objectStates.forEach((objectState, index) => {
            const totalForceOnBody = forces.get(index);
            let newAcceleration = (totalForceOnBody !== undefined) ? (totalForceOnBody) : (new Vector2D(0, 0));
            newAcceleration = newAcceleration.scale(1 / objectState.body.mass);
            objectState.acceleration = newAcceleration;
        });
    }
    private calculateForces() {
        const forces: Map<number, Vector2D> = new Map();
        
        for (let i = 0; i < this.objectStates.length; i++) {
            for (let j = i+1; j < this.objectStates.length; j++) {
                const forceOnI = this.calculateForceBetweenBodies(i, j);
                const forceOnJ = forceOnI.scale(-1);

                forces.set(i, (forces.get(i) || new Vector2D(0, 0)).add(forceOnI));
                forces.set(j, (forces.get(j) || new Vector2D(0, 0)).add(forceOnJ));
            }
        }
        return forces;
    }
    /**
     * Calculates the next **position** and **velocity** of the object in state, and updates state accordingly.
     * @param state *ObjectState* containing the body
     */
    private updateVelocityAndPosition(objectState: ObjectState) {
        const dt = this.tickLength / 1000;
        if (!objectState.body.movable) { return; }
        // update velocity based on acceleration: v = v + a * dt
        objectState.velocity = objectState.velocity.add(objectState.acceleration.scale(dt));

        // update position based on velocity: x = x + v * dt
        objectState.position =  objectState.position.add(objectState.velocity.scale(dt));
    }
    /**
     * Calculates the force-vector between the bodies in objectStates at index [i] and [j]
     * @returns a vector representing the force applied ***to*** body at ***objectStates[i]***
     */
    private calculateForceBetweenBodies(i: number, j: number): Vector2D {
        const objectStateI = this.objectStates[i];
        const objectStateJ = this.objectStates[j];

        const distance = objectStateI.position.distance(objectStateJ.position);
        if (distance < this.gravityLowerBounds || distance === 0) // if the bodies are too close, skip the calculation
            { return new Vector2D(0, 0); } 
        const netForceBetweenBodies: number = this.g * ((objectStateI.body.mass * objectStateJ.body.mass)/(distance * distance));
        const unitVectorIToJ = objectStateJ.position.subtract(objectStateI.position).normalize();
        return unitVectorIToJ.scale(netForceBetweenBodies);
    }
    private handleCollisions() {
        for (let i = 0; i < this.objectStates.length; i++) {
            const objectStateI = this.objectStates[i];
            // undefined, if objectStateI has been merged in a previous collision
            if (objectStateI === undefined) {
                continue;
            }
            for (let j = i+1; j < this.objectStates.length; j++) {
                const objectStateJ = this.objectStates[j];
                const distanceIJ = objectStateI.position.distance(objectStateJ.position);
                const collision = distanceIJ <= objectStateI.body.radius + objectStateJ.body.radius;
                if (collision) {
                    if (distanceIJ <= objectStateI.body.radius || distanceIJ <= objectStateJ.body.radius) { 
                        this.mergeBodies(i, j);
                    } else {
                        if (this.elasticCollisions) {
                            this.elasticCollision(objectStateI, objectStateJ);
                        }
                    }
                }
            }
        }
    }
    /**
     * Merges the two bodies into one. The lighter body is merged into the heavier one. Momentum is preserved.
     */
    private mergeBodies(index1: number, index2: number) {
        const state1: ObjectState = this.objectStates[index1];
        const state2: ObjectState = this.objectStates[index2];
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
        changeObject.body.mass = totalMass;
        changeObject.body.radius = changeObject.body.defaultRadius();
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
        const lowerBounds = 1; // lower bounds for the distance between bodies
        
        // normal vector between the bodies
        const displacement = body1.position.displacementVector(body2.position);
        const distance = displacement.magnitude(); 
        if (distance <= lowerBounds || distance === 0) { 
            return; 
        }
        const normalizedDisplacement = displacement.scale(1 / distance);

        // relative velocity along the normalDisplacement
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
    }
    private placeOverlappingBodiesTangentially(objectState1: ObjectState, objectState2: ObjectState) {
        const displacement = objectState1.position.displacementVector(objectState2.position);
        const normalDisplacement = displacement.normalize();        
        const targetDistance = objectState1.body.radius + objectState2.body.radius;
        const totalMoveDistance = targetDistance - displacement.magnitude();
        const moveBody1 = normalDisplacement.scale(totalMoveDistance * (objectState1.body.radius / targetDistance));
        const moveBody2 = normalDisplacement.scale(totalMoveDistance * (objectState2.body.radius / targetDistance));
    
        objectState1.position = objectState1.position.subtract(moveBody1);
        objectState2.position = objectState2.position.add(moveBody2);
    }
    public run() {
        if (this.running) {
            return;
        }
        this.running = true;

        const runSimulationStep = () => {
            if (this.running) {
                setTimeout(runSimulationStep, this.tickLength);
                this.nextState();
            }
        };
        runSimulationStep();
    }
}
