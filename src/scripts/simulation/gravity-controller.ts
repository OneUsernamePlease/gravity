import { ObjectState } from "../types/types";
import { Vector2D } from "../util/vector2d";
import { Body2d, Gravity as GravitySimulation } from "./gravity";

export class GravityController {
//#region properties
    private _simulation: GravitySimulation;
//#endregion
    private get simulation() {
        return this._simulation;
    }

//#region API
    public get tick() {
        return this._simulation.tick;
    }
    public get simulationState(): ObjectState[] {
        return this.simulation.simulationState;
    }
    public get running(): boolean {
        return this.simulation.running;
    }
    constructor() {
        this._simulation = new GravitySimulation();
        
    }

    public addObject(body: Body2d, position: Vector2D, velocity: Vector2D): number 
    public addObject(objectState: ObjectState): number 
    public addObject(bodyOrObject: ObjectState | Body2d, position?: Vector2D, velocity?: Vector2D): number {
        if (bodyOrObject instanceof Body2d) {
            bodyOrObject = {body: bodyOrObject, position: position!, velocity: velocity!, acceleration: new Vector2D(0, 0)};
        }
        if (!bodyOrObject.body.movable) {
            bodyOrObject.velocity = new Vector2D(0, 0);
        }
        return this.simulation.addObject(bodyOrObject);
    }
    public reset() {
        this.simulation.reset();
    }
    public run() {
        this.simulation.run();
    }
    public stop() {
        this.simulation.stop();
    }
    public setG(g: number): number {
        return this.simulation.setG(g);
    }
    public setCollisions(collisions: boolean, elastic: boolean) {
        this.simulation.setCollisions(collisions, elastic);
    }
    public advanceTick() {
        return this.simulation.advanceTick();
    }
//#endregion
}