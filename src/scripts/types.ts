import { Body2d } from "./gravity";
import { Vector2D } from "./vector2d";
export interface AnimationSettings {
    defaultScrollRate: number;
    defaultZoomStep: number;
    frameLength: number; // ms
    displayVectors: boolean;
    tracePaths: boolean;
}
export interface Mouse {
   main: MouseButton;
   secondary: MouseButton;
   wheel: MouseButton;
}
export interface MouseButton {
    state: ButtonState;
    downCoordinates: { x: number, y: number } | null; // coordinates of the mouse when button was pressed down
}
export enum ButtonState {
    Up = 0,
    Down = 1,
}
export enum CanvasClickAction {
    None = 0,
    AddBody = 1,
    ScrollCanvas = 2,
}
export enum MouseButtons {
    Main = 0,
    Wheel = 1,
    Secondary = 2,
}
export interface CanvasSpace { 
    // use this to transform simulationSpace to canvasSpace and back
    origin: Vector2D, // the canvas' origin in simulation space
    currentZoom: number, // simulationUnits (meter) per canvasUnit
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
/*
    UI stuff
*/
export interface StatusBar {
    fields: HTMLSpanElement[];
}    
export interface IUI {
    statusBar: StatusBar;
    // top menu
    resetButton: HTMLElement;
    playPauseButton: HTMLElement;
    stepButton: HTMLElement;
    repositoryLink: HTMLElement;

    // main menu
    zoomInButton: HTMLElement;
    zoomOutButton: HTMLElement;
    scrollUpButton: HTMLElement;
    scrollDownButton: HTMLElement;
    scrollLeftButton: HTMLElement;
    scrollRightButton: HTMLElement;

    displayVectorsCheckbox: HTMLInputElement;

    collisionDetectionCheckbox: HTMLInputElement;
    elasticCollisionsCheckbox: HTMLInputElement;
    gravitationalConstantInput: HTMLInputElement;

    clickActionSelect: HTMLSelectElement;
    addBodyMassInput: HTMLInputElement;
    addBodyMovableCheckbox: HTMLInputElement;
}