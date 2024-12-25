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
            mass = 1;
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
    
}

export interface SimulationState {
    objectStates: { body: Body2d, position: IVector2D, velocity: IVector2D }[];
    running: boolean;
    tickCount: number;
}
