import { Vector2D, IVector2D } from "tcellib-vectors";

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
            color = "green"
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
    public set color(c : string) {
        this._color = c;
    } 
    //#endregion
}
export interface ObjectState {
    body: Body2d, 
    position: IVector2D,
    /**
     * units per tick
     */
    velocity: IVector2D,
    acceleration: IVector2D
}
export class Simulation {
    private _objectStates: ObjectState[];
    public running: boolean;
    public tickCount: number;
    private _tickLength: number;
    constructor() {
        this._objectStates = [];
        this.running = false;
        this.tickCount = 0;
        this._tickLength = 100;
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
    public nextBodyState(state: ObjectState, tickLength: number) {
        const newX = state.position.x + state.velocity.x * tickLength + ((state.acceleration.x * (tickLength^2)) / 2);
        const newY = state.position.y + state.velocity.y * tickLength + ((state.acceleration.y * (tickLength^2)) / 2);

        const newVelX = state.velocity.x + state.acceleration.x * tickLength;
        const newVelY = state.velocity.y + state.acceleration.y * tickLength;
        
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
        this._objectStates.forEach(objectState => {
            this.nextBodyState(objectState, this.tickLength)
        });
        //calculate new accelerations vectors
        
        this.tickCount++;
    }
    public run() {
    /* old version

        if (!this.running) {
            return;
        }
        setTimeout(() => {
            if (this.running) { //dont need this if i think
                this.run();
            }
            this.nextState();
        }, this.tickLength);
    */
        if (this.running) {
            return;
        }
        this.running = true;

        const runSimulationStep = () => {
            if (this.running) {
                this.nextState();
                setTimeout(runSimulationStep, this.tickLength);
                //this.log("running simulation step")
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

