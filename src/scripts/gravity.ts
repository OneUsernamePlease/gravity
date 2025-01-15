import { Vector2D } from "tcellib-vectors";

export class Body2d {
    private _mass!: number;
    private _radius!: number;
    private _color!: string;
    private _movable!: boolean;
    static defaultDensity = 1;

    // #region constructor, get, set
    constructor(mass: number, movable?: boolean, color?: string, radius?: number)  {
        this.mass = mass;
        if (radius === undefined) { radius = this.getDefaultRadius(mass); }
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
    public getDefaultRadius(mass?: number) {
        if (mass === undefined) {
            mass = this.mass;
        }
        return ((3 * this.mass)/(4 * Math.PI * Body2d.defaultDensity)) ** (1/3); 
    }
}
export interface ObjectState {
    body: Body2d, 
    position: Vector2D,
    /**
     * simulationUnits (meter?) per second
     */
    velocity: Vector2D,
    acceleration: Vector2D
}
export class Simulation {
    private _objectStates: ObjectState[];
    public _running: boolean;
    public _tickCount: number;
    private _tickLength: number;
    private _collisionDetection: boolean;
    private _g: number; // gravitational constant
    private readonly gravityLowerBounds: number = 1; // force calculations for distances lower than this number are skipped
    constructor() { 
        this._objectStates = [];
        this._running = false;
        this._tickCount = 0;
        this._tickLength = 10; // ms
        this._collisionDetection = false;
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
    public get g() {
        return this._g;
    }
    public set g(g: number) {
        this._g = Math.max(g, Number.MIN_VALUE);
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
    public removeAtIndex(i: number) {
        this.objectStates.splice(i, 1); // remove objectStateJ
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
        const forces: Map<number, Vector2D> = new Map(); // to keep track of the resulting force (sum of forces) on each body (by each other body) in objectStates[]
        
        // calculate forces on each body
        for (let i = 0; i < this.objectStates.length; i++) {
            for (let j = i+1; j < this.objectStates.length; j++) {
                const forceOnI = this.calculateForceBetweenBodies(i, j);
                const forceOnJ = Vector2D.scale(forceOnI, -1); // force on j = (-1) * (force on i) -- opposite direction

                // Update the force on both bodies
                forces.set(i, Vector2D.add(forces.get(i) || new Vector2D(0, 0), forceOnI));
                forces.set(j, Vector2D.add(forces.get(j) || new Vector2D(0, 0), forceOnJ));
            }
        }

        // update acceleration
        this.objectStates.forEach((objectState, index) => {
            const totalForceOnBody = forces.get(index);
            let newAcceleration = (totalForceOnBody !== undefined) ? (totalForceOnBody) : (new Vector2D(0, 0));
            newAcceleration = Vector2D.scale(newAcceleration, 1 / objectState.body.mass);
            objectState.acceleration = newAcceleration;
        });
    }
    /**
     * Calculates the next **position** and **velocity** of the object in state, and updates state accordingly.
     * @param state *ObjectState* containing the body
     */
    private updateVelocityAndPosition(objectState: ObjectState) {
        const dt = this.tickLength / 1000;
        if (!objectState.body.movable) { return; }
        // update velocity based on acceleration: v = v + a * dt
        objectState.velocity = Vector2D.add(objectState.velocity, Vector2D.scale(objectState.acceleration, dt));

        // update position based on velocity: x = x + v * dt
        objectState.position = Vector2D.add( objectState.position, Vector2D.scale(objectState.velocity, dt));
    }
    /**
     * Calculates the force-vector between the bodies in objectStates at index [i] and [j]
     * @returns a vector representing the force applied ***to*** body at ***objectStates[i]***
     */
    private calculateForceBetweenBodies(i: number, j: number): Vector2D {
        const objectStateI = this.objectStates[i];
        const objectStateJ = this.objectStates[j];

        const distance = Vector2D.distance(objectStateI.position, objectStateJ.position);
        if (distance < this.gravityLowerBounds || distance === 0) // if the bodies are too close, skip the calculation
            { return new Vector2D(0, 0); } 
        const netForceBetweenBodies: number = this.g * ((objectStateI.body.mass * objectStateJ.body.mass)/(distance * distance)); // net force between bodies as scalar
        const unitVectorIToJ = Vector2D.normalize(Vector2D.subtract(objectStateJ.position, objectStateI.position)); // normalized vector from I to J
        return Vector2D.scale(unitVectorIToJ, netForceBetweenBodies); // return force-vector applied to i, which is (unitVector from I to J) multiplied by (netForce)
    }
    private handleCollisions() {
        for (let i = 0; i < this.objectStates.length; i++) {
            const objectStateI = this.objectStates[i];
            if (objectStateI === undefined) { // undefined, if objectStateI has been merged in a previous collision
                continue;
            }
            for (let j = i+1; j < this.objectStates.length; j++) {
                const objectStateJ = this.objectStates[j];
                const distanceIJ = Vector2D.distance(objectStateI.position, objectStateJ.position);
                const collision = distanceIJ <= objectStateI.body.radius + objectStateJ.body.radius;
                if (collision) {
                    if (distanceIJ <= objectStateI.body.radius || distanceIJ <= objectStateJ.body.radius) { 
                        this.mergeBodies(i, j);
                    } else {
                        this.elasticCollision(objectStateI, objectStateJ)
                    }
                }
            }
        }
    }
    /**
     * merges the two bodies into one (the one at index1), removes the body at index2 from objectStates
     */
    private mergeBodies(index1: number, index2: number) {
        const state1: ObjectState = this.objectStates[index1];
        const state2: ObjectState = this.objectStates[index2];
        const totalMomentum = Vector2D.add(Vector2D.scale(state1.velocity, state1.body.mass), Vector2D.scale(state2.velocity, state2.body.mass));
        const totalMass = state1.body.mass + state2.body.mass;
        const resultingVelocity = Vector2D.scale(totalMomentum, 1 / totalMass);
        
        state1.velocity = resultingVelocity;
        state1.body.mass = totalMass;
        state1.body.radius = state1.body.getDefaultRadius();
        state1.body.movable = (state1.body.movable && state2.body.movable);
        if (!state1.body.movable) {
            state1.velocity = {x: 0, y: 0};
        }
        this.removeAtIndex(index2);
    }
    /**
    * @param restitution number between 0 (perfectly inelastic) and 1 (perfectly elastic)
    */
    private elasticCollision(body1: ObjectState, body2: ObjectState, restitution: number = 1) {
        const lowerBounds = 1; // lower bounds for the distance between bodies
        
        // normal vector between the bodies
        const displacement = Vector2D.displacementVector(body1.position, body2.position);
        const distance = Vector2D.magnitude(displacement); 
        if (distance <= lowerBounds || distance === 0) { 
            return; 
        }
        const normalizedDisplacement = Vector2D.scale(displacement, 1 / distance);

        // relative velocity along the normalDisplacement
        const relativeVelocity = Vector2D.subtract(body2.velocity, body1.velocity);
        const velocityAlongDisplacement = Vector2D.dotProduct(relativeVelocity, normalizedDisplacement); // relative Velocity projected onto the normalized displacement

        // if the bodies are moving apart, do nothing
        if (velocityAlongDisplacement > 0) { return; }

        // compute the impulse scalar based on the restitution coefficient ???
        const impulseScalar = -(1 + restitution) * velocityAlongDisplacement / (body1.body.mass + body2.body.mass);

        // update velocities based on the impulse scalar
        const deltaV1 = Vector2D.scale(normalizedDisplacement, impulseScalar * body2.body.mass);
        const deltaV2 = Vector2D.scale(normalizedDisplacement, impulseScalar * body1.body.mass);

        body1.velocity = Vector2D.subtract(body1.velocity, deltaV1);
        body2.velocity = Vector2D.add(body2.velocity, deltaV2);
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
