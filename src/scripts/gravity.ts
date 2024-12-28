import { Vector2D } from "tcellib-vectors";

export class Body2d {
    private _mass!: number;
    private _radius!: number;
    private _color!: string;
    private _movable!: boolean; //whether the body will move from effects of gravity
    private defaultDensity = 1;

    //#region constructor, get, set
    constructor(mass?: number, radius?: number, color?: string)  {
        if (mass === undefined) {
            mass = 25;
        }
        this.mass = mass;

        if (radius === undefined) {
            radius = ((3 * this.mass)/(4 * Math.PI * this.defaultDensity)) ** (1/3);
        }
        this.radius = radius;

        if (color === undefined) {
            color = "white"
        }
        this.color = color;

        this.movable = true;
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
     * canvasUnits per second
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
    constructor() {
        this._objectStates = [];
        this.running = false;
        this.tickCount = 0;
        this._tickLength = 50;
        this._g = 1;
    }
    public get objectStates() {
        return this._objectStates;
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
    /**
     * Calculates the next **position** and **velocity** of the object in state, and updates state accordingly.
     * Does **NOT** update acceleration.
     * @param state *ObjectState* containing the body
     */
    public nextBodyState(state: ObjectState) {
        let deltaT = (this.tickLength / 1000); //tickLength (ms) / 1000 ms/s -> timeDiff in seconds
        const newX = state.position.x + state.velocity.x * deltaT + ((state.acceleration.x * (deltaT^2)) / 2);
        const newY = state.position.y + state.velocity.y * deltaT + ((state.acceleration.y * (deltaT^2)) / 2);

        const newVelX = state.velocity.x + state.acceleration.x * deltaT;
        const newVelY = state.velocity.y + state.acceleration.y * deltaT;
        
        state.position.x = newX;
        state.position.y = newY;
        state.velocity.x = newVelX;
        state.velocity.y = newVelY;
    }
    public addObject(objectState: ObjectState): number {
        this._objectStates.push(objectState);
        return this._objectStates.length;
    }
    public clearObjects() {
        this._objectStates = [];
    }
    public pause() {
        this.running = false;
    }
    public nextState() {
        //calculate new accelerations vectors and update objectStates accordingly
        this.updateAccelerationVectors();

        //update position and velocity arising therefrom
        this.objectStates.forEach(objectState => {
            this.nextBodyState(objectState)
        });
        
        this.tickCount++;
    }
    public updateAccelerationVectors() {
        const forces: Map<number, Vector2D> = new Map(); //to keep track of the resulting force (sum of forces) on each body (by each other body) in objectStates[]
        
        for (let i = 0; i < this.objectStates.length; i++) {
            for (let j = i+1; j < this.objectStates.length; j++) {
                const forceOnI = this.calculateForceBetweenBodies(i, j); //Calc force on i
                const forceOnJ = Vector2D.scale(forceOnI, -1); //force on i = (-1) * (force on j) -- opposite direction

                //Update the force on both bodies
                forces.set(i, (forces.has(i) ? Vector2D.add(forces.get(i)!, forceOnI) : forceOnI));
                forces.set(j, (forces.has(j) ? Vector2D.add(forces.get(j)!, forceOnJ) : forceOnJ));
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
     * Calculates the force-vector between the bodies in objectStates[i] and [j]
     * @returns a vector representing the force applied ***to*** body at objectStates[i]
     */
    public calculateForceBetweenBodies(i: number, j: number): Vector2D {
        const objectStateI = this.objectStates[i];
        const objectStateJ = this.objectStates[j];

        const distance = Vector2D.distance(objectStateI.position, objectStateJ.position);
        if (distance < 1e-10) { return new Vector2D(0, 0); } //if the bodies are too close, skip the calculation
        const netForceBetweenBodies: number = this.g * ((objectStateI.body.mass * objectStateJ.body.mass)/(distance * distance)); //net force between bodies as scalar
        const unitVectorIToJ = Vector2D.normalize(Vector2D.subtract(objectStateJ.position, objectStateI.position)); //normalized vector from I to J
        return Vector2D.scale(unitVectorIToJ, netForceBetweenBodies); //return force-vector applied to j, which is (unitVector from I to J) multiplied by (netForce)
    }

    public updateAccelerationVectors_old() {
        //keeping this for now to compare this and the new algorithm
        this.objectStates.forEach((objectState, index) => {
            //compute sum of gravitational forces
            const resultingForceOnBody = this.calculateForcesForBody(index)
            
            //compute acceleration and update objectStates
            const newAcceleration: Vector2D = Vector2D.scale(resultingForceOnBody, 1 / objectState.body.mass)
            objectState.acceleration = newAcceleration;
        });
    };
    /**
     * calculates the force applied to one body in objectStates, resulting from gravity from all other bodies
     * @param i index of the body in this.objectStates
     */
    public calculateForcesForBody(cur: number): Vector2D {
        //soon to be obsolete    
        let totalForce: Vector2D = {x: 0, y: 0};
        const targetBody = this.objectStates[cur];
        for (let i = 0; i < this.objectStates.length; i++) {
            if (i === cur) { continue; }
            const curForceApplyingBody = this.objectStates[i]; //the body whose force on the target is being calculated
            const distance: number = Vector2D.distance(targetBody.position, curForceApplyingBody.position);
            if (distance < 1e-10) { continue; }
            let netForceFromBody: number = this.g * ((targetBody.body.mass * curForceApplyingBody.body.mass)/(distance * distance)); //net force from the body as scalar
            let unitVectorFromApplyingToTargetBody = Vector2D.normalize(Vector2D.subtract(curForceApplyingBody.position, targetBody.position)); //normalized vector from target to applying
            let forceVectorFromBody = Vector2D.scale(unitVectorFromApplyingToTargetBody, netForceFromBody); //net force multiplied by unit vector from the applying body to the target body
            totalForce = Vector2D.add(totalForce, forceVectorFromBody);
        }
        return totalForce; //sum all forces on target body and return resulting force
    }
    public run() {
        if (this.running) {
            return;
        }
        this.running = true;

        const runSimulationStep = () => {
            if (this.running) {
                this.nextState();
                setTimeout(runSimulationStep, this.tickLength);

                this.log("running simulation step " + this.tickCount);
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
