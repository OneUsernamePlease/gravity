import { Vector2D } from "tcellib-vectors";

export class Body2d {
    private _mass!: number;
    private _radius!: number;
    private _color!: string;
    private _movable!: boolean; //whether the body will move from effects of gravity
    static defaultDensity = 1;

    //#region constructor, get, set
    constructor(mass?: number, radius?: number, color?: string, movable?: boolean)  {
        if (mass === undefined) { mass = 25; }
        if (radius === undefined) { radius = ((3 * mass)/(4 * Math.PI * Body2d.defaultDensity)) ** (1/3); }
        if (color === undefined) { color = "white" }
        if (movable === undefined) { movable = true; }
        this.mass = mass;
        this.radius = radius;
        this.color = color;
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
    //#endregion
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
    public running: boolean;
    public tickCount: number;
    private _tickLength: number;
    private _g: number; //gravitational constant
    private readonly gravityLowerBounds: number = 1; //force calculations for distances lower than this number are skipped
    constructor() { 
        this._objectStates = [];
        this.running = false;
        this.tickCount = 0;
        this._tickLength = 10; //ms
        this._g = 1;
    }
    public get objectStates() {
        return this._objectStates;
    }
    public set objectStates(objectState: ObjectState[]) {
        this._objectStates = objectState;
    }
    public get tickLength() {
        return this._tickLength;
    }
    public set tickLength(t: number) {
        this._tickLength = t;
    }
    public get g() {
        return this._g;
    }
    public set g(g: number) {
        this._g = Math.max(g, Number.MIN_VALUE);
    }
//#endregion
    public addObject(objectState: ObjectState): number {
        if (!objectState.body.movable) {
            objectState.velocity = new Vector2D(0, 0);
            objectState.acceleration = new Vector2D(0, 0);
        }
        this.objectStates.push(objectState);
        return this.objectStates.length;
    }
    public clearObjects() {
        this.objectStates = [];
    }
    public pause() {
        this.running = false;
    }
    public nextState() {
        //calculate new accelerations vectors and update objectStates accordingly
        this.updateAccelerationVectors();
        
        //update position and velocity arising therefrom
        this.objectStates.forEach(objectState => {
            this.updateVelocityAndPosition(objectState)
        });
        
        this.tickCount++;
    }
    public updateAccelerationVectors() {
        const forces: Map<number, Vector2D> = new Map(); //to keep track of the resulting force (sum of forces) on each body (by each other body) in objectStates[]
        
        //calculate forces on each body
        for (let i = 0; i < this.objectStates.length; i++) {
            for (let j = i+1; j < this.objectStates.length; j++) {
                const forceOnI = this.calculateForceBetweenBodies(i, j);
                const forceOnJ = Vector2D.scale(forceOnI, -1); //force on j = (-1) * (force on i) -- opposite direction

                //Update the force on both bodies
                forces.set(i, Vector2D.add(forces.get(i) || new Vector2D(0, 0), forceOnI));
                forces.set(j, Vector2D.add(forces.get(j) || new Vector2D(0, 0), forceOnJ));
            }
        }

        //update acceleration
        this.objectStates.forEach((objectState, index) => {
            const totalForceOnBody = forces.get(index);
            let newAcceleration = (totalForceOnBody !== undefined) ? (totalForceOnBody) : (new Vector2D(0, 0));
            newAcceleration = Vector2D.scale(newAcceleration, 1 / objectState.body.mass);
            objectState.acceleration = newAcceleration;
        });
    };
    /**
     * Calculates the next **position** and **velocity** of the object in state, and updates state accordingly.
     * @param state *ObjectState* containing the body
     */
    public updateVelocityAndPosition(objectState: ObjectState) {
        //update velocity based on acceleration: v = v + a * dt
        const dt = this.tickLength / 1000;
        if (!objectState.body.movable) { return; }
        objectState.velocity = Vector2D.add(objectState.velocity, Vector2D.scale(objectState.acceleration, dt));

        //update position based on velocity: x = x + v * dt
        objectState.position = Vector2D.add( objectState.position, Vector2D.scale(objectState.velocity, dt));
    }
    /**
     * Calculates the force-vector between the bodies in objectStates at index [i] and [j]
     * @returns a vector representing the force applied ***to*** body at ***objectStates[i]***
     */
    public calculateForceBetweenBodies(i: number, j: number): Vector2D {
        const objectStateI = this.objectStates[i];
        const objectStateJ = this.objectStates[j];

        const distance = Vector2D.distance(objectStateI.position, objectStateJ.position);
        if (distance < this.gravityLowerBounds || distance === 0) //if the bodies are too close, skip the calculation
            { return new Vector2D(0, 0); } 
        const netForceBetweenBodies: number = this.g * ((objectStateI.body.mass * objectStateJ.body.mass)/(distance * distance)); //net force between bodies as scalar
        const unitVectorIToJ = Vector2D.normalize(Vector2D.subtract(objectStateJ.position, objectStateI.position)); //normalized vector from I to J
        return Vector2D.scale(unitVectorIToJ, netForceBetweenBodies); //return force-vector applied to i, which is (unitVector from I to J) multiplied by (netForce)
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
                //this.log("running simulation step " + this.tickCount);
            }
        };
        runSimulationStep();
    }
    public log(message: string) {
        const timestamp = new Date();
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        const seconds = timestamp.getSeconds().toString().padStart(2, '0');
        const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');
    
        const formattedTimestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;
        console.log(`[${formattedTimestamp}] ${message}`);
    };
}
