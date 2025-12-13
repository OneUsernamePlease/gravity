import { Body2d } from "../simulation/body2d";
import { Vector2D } from "../util/vector2d";

//++++++++++++++++++++
//+ pointer (touch, mouse)
//++++++++++++++++++++
export interface Pointer {
    main: {
        state: ButtonState;
        downCoordinatesInSimSpace: Vector2D | undefined;
    };
    secondary: {
        state: ButtonState;
    };
    wheel: {
        state: ButtonState;
    };
}
export enum TouchAction {
    None = 0,
    AddBody = 1,
    ManipulateView = 2
}
export enum MouseAction {
    None = 0,
    AddBody = 1,
    Scroll = 2,
    Zoom = 3
}
export interface MultiTouchGesture {
    first: Vector2D;
    second: Vector2D;
    midpoint: Vector2D; 
    distance: number;
}
export interface Mouse {
   main: MouseButton;
   secondary: MouseButton;
   wheel: MouseButton;
}
export interface MouseButton {
    state: ButtonState;
    downCoordinatesInSimSpace?: { x: number, y: number } | Vector2D;
}
export enum ButtonState {
    Up = 0,
    Down = 1,
}
export enum MouseButtons {
    Main = 0,
    Wheel = 1,
    Secondary = 2,
}

//++++++++++++++++++++
//+ view and animation
//++++++++++++++++++++
export interface CanvasSpace {
    // use this to transform simulationSpace to canvasSpace and back
    origin: Vector2D, // the canvas' origin in simulation space
    currentZoom: number, // simulationUnits (meter) per canvasUnit
    orientationY: number; // in practice this is -1, as the y-axis of the canvas points in the opposite direction of the simulation
}
export interface AnimationSettings {
    frameLength: number; // ms
    displayVectors: boolean;
    tracePaths: boolean;
}
export interface UIAnimationSettings {
    displayVectors: boolean;
    //tracePaths: boolean;
}

//++++++++++++++++++++
//+ user-input-related
//++++++++++++++++++++
export interface SimulationSettings {
    collisionDetection?: boolean;
    elasticCollisions?: boolean;
    gravitationalConstant?: number;
}

export interface ObjectState {
    body: Body2d, 
    position: Vector2D,
    velocity: Vector2D, // simulationUnits (meter) per second
    acceleration: Vector2D
}

//++++++++++++++++++++
//+ UI
//++++++++++++++++++++
export interface StatusBar {
    bar: HTMLDivElement
    fields: HTMLSpanElement[];
}
export interface RadioButtonGroup {
    name: string;
    buttons: HTMLInputElement[];
}
export interface UIElements {
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

    clickAction: HTMLSelectElement | RadioButtonGroup;
    massInput: HTMLInputElement;
    movableCheckbox: HTMLInputElement;
}