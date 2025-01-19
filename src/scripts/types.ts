import { Body2d } from "./gravity";
import { Vector2D } from "./vector2d";
export interface AnimationSettings {
    defaultScrollRate: number;
    defaultZoomStep: number;
    frameLength: number; // ms
    displayVectors: boolean;
    tracePaths: boolean;

}
export enum CanvasClickAction {
    None = 0,
    AddBody = 1,
    ScrollCanvas = 2,
}
export enum MouseBtnState {
    Up = 0,
    Down = 1,
}
export interface CanvasSpace { 
    // use this to transform simulationSpace to canvasSpace and back
    origin: Vector2D, // the canvas' origin in simulation space
    zoomFactor: number, // simulationUnits (meter) per canvasUnit
    orientationY: number; // in practice this is -1, as the y-axis of the canvas is in the opposite direction of the simulation
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