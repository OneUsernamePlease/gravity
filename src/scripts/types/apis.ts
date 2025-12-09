import { Vector2D } from "../util/vector2d";
import { ObjectState, SimulationSettings } from "./types";
export interface SimulationAPI {
    addObject: (objectState: ObjectState) => number,
    reset: () => void,
    run: () => void,
    stop: () => void,

    setG: (g: number) => number,
    setCollisions: (collisions: boolean, elastic: boolean) => void,
    applySettings: (settings: SimulationSettings) => void,

    get simulationState(): ObjectState[],
    get running(): boolean,
    get tick(): number,
}
export interface AnimationController {
    zoomIn: (factor: number, zoomCenter: Vector2D) => number,
    zoomOut: (factor: number, zoomCenter: Vector2D) => number,

    scrollUp: (distance: number) => void,
    scrollDown: (distance: number) => void,
    scrollLeft: (distance: number) => void,
    scrollRight: (distance: number) => void,
    scroll: (distance: Vector2D) => void,
}
export interface ViewController {
    zoomTo: (toFactor: number, zoomCenter: Vector2D) => number,
    scroll: (distance: Vector2D) => void,
    setView: (origin: Vector2D, zoom: number) => void,
}



