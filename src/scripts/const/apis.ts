import { Body2d } from "../simulation/gravity";
import { Vector2D } from "../util/vector2d";
import { ObjectState } from "./types";
export interface SimulationAPI {
    addObject: (body: Body2d, position: Vector2D, velocity: Vector2D) => number,
    reset: () => void,
    run: () => void,
    pause: () => void,

    setG: (g: number) => number,

    get simulationState(): ObjectState[],
    get running(): boolean,
}