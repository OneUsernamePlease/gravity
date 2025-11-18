import { Vector2D } from "./vector2d";
import { MouseButton, ButtonState, Mouse, MouseButtons } from "./types";
import { Canvas } from "./canvas";
import * as tsEssentials from "./essentials";
import { App } from "./app";
import * as c from "../const";

let app: App;
let mouse: Mouse = { main: { state: ButtonState.Up, downCoordinates: null }, 
                     secondary: { state: ButtonState.Up, downCoordinates: null }, 
                     wheel: { state: ButtonState.Up, downCoordinates: null} };
// ui Objects (toDo) 

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    document.removeEventListener("DOMContentLoaded", initialize);
    initializeApp();
    registerEvents();
    app.run();
}
function initializeApp() {
    app = new App();
    app.initialize();
}
function registerEvents() {
    document.getElementById(c.CANVAS_ID)?.addEventListener("mousedown", canvasMouseDown);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mouseup", canvasMouseUp);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mousemove", canvasMouseMoving);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchstart", canvasTouchStart);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchend", canvasTouchEnd);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchmove", canvasTouchMove);
    document.getElementById(c.CANVAS_ID)?.addEventListener("wheel", canvasMouseWheel);
    document.getElementById(c.CANVAS_ID)?.addEventListener("contextmenu", (ev) => {ev.preventDefault()});
    document.addEventListener("mousedown", mouseDown);
    window.addEventListener("resize", windowResized);
}

function windowResized(this: Window, ev: UIEvent) {
    let windowWidth = this.innerWidth;
    let windowHeight = this.innerHeight;
    app.resizeCanvas(windowWidth, windowHeight);
}
function canvasMouseDown(this: HTMLElement, ev: MouseEvent) {
    const absoluteMousePosition: Vector2D = getAbsoluteMousePosition(ev);
    if (ev.button === MouseButtons.Main) {
        tsEssentials.log(`main mouse down absolute pos: ${absoluteMousePosition.toString()}`);
        tsEssentials.log(`main mouse down on canvas ${app.absoluteToCanvasPosition(absoluteMousePosition).toString()}`);
        app.canvasMainMouseDown(absoluteMousePosition);
    } else if (ev.button === MouseButtons.Wheel) {
        ev.preventDefault(); // prevent scroll-symbol
    } else if (ev.button === MouseButtons.Secondary) {
        // handled at document level
    }
}
function canvasMouseMoving(this: HTMLElement, ev: MouseEvent) {
    if (mouse.secondary.state === ButtonState.Down) {
        const currentMovement = new Vector2D(ev.movementX, ev.movementY);
        app.canvasSecondaryMouseDragging(currentMovement);
        mouse.secondary.downCoordinates = { x: ev.clientX, y: ev.clientY };
    }
}
function canvasMouseUp(this: HTMLElement, ev: MouseEvent) {
    const absoluteMousePosition: Vector2D = getAbsoluteMousePosition(ev);
    switch (ev.button) {
        case MouseButtons.Main:
            tsEssentials.log(`main mouse up absolute pos: ${absoluteMousePosition.toString()}`);
            tsEssentials.log(`main mouse up on canvas ${app.absoluteToCanvasPosition(absoluteMousePosition).toString()}`);
            app.canvasMainMouseUp(absoluteMousePosition);
            mouse.main.state = ButtonState.Up;
            break;
    
        case MouseButtons.Wheel:
            // prevent scroll-symbol
            ev.preventDefault();
            
            mouse.wheel.state = ButtonState.Down;
            mouse.wheel.downCoordinates = { x: ev.clientX, y: ev.clientY };
            break;
    
        case MouseButtons.Secondary:
            // prevent context menu
            ev.preventDefault();
            
            mouse.secondary.state = ButtonState.Up;
            break;
    
        default:
            break;
    }
}
function canvasTouchStart(this: HTMLElement, ev: TouchEvent) {
    //app.canvasTouchStart(ev);
}
function canvasTouchMove(this: HTMLElement, ev: TouchEvent) {
    //app.canvasTouchMove(ev); // toDo
}
function canvasTouchEnd(this: HTMLElement, ev: TouchEvent) {
    //app.canvasTouchEnd(ev);
}
function canvasMouseWheel(this: HTMLElement, ev: WheelEvent) {
    // don't resize the entire page
    ev.preventDefault();
    
    const cursorPos = getAbsoluteMousePosition(ev);
    const posInCanvasSpace = app.absoluteToCanvasPosition(cursorPos);
    const positionInSimSpace = app.gravityAnimationController.pointFromCanvasSpaceToSimulationSpace(posInCanvasSpace);

    if (ev.deltaY < 0) {
        app.zoomIn(positionInSimSpace);
    } else if (ev.deltaY > 0) {
        app.zoomOut(positionInSimSpace);
    }
}
function mouseDown(this: Document, ev: MouseEvent) {
    if (ev.button === MouseButtons.Main) {
        mouse.main.state = ButtonState.Down;
        mouse.main.downCoordinates = { x: ev.clientX, y: ev.clientY };

    } else if (ev.button === MouseButtons.Wheel) {
        mouse.wheel.state = ButtonState.Down;
        mouse.wheel.downCoordinates = { x: ev.clientX, y: ev.clientY };

    } else if (ev.button === MouseButtons.Secondary) {
        mouse.secondary.state = ButtonState.Down;
        mouse.secondary.downCoordinates = { x: ev.clientX, y: ev.clientY };
    }
}
// functions that are not listeners
function getAbsoluteMousePosition(ev: MouseEvent | WheelEvent): Vector2D {
    const position = new Vector2D(ev.clientX,  ev.clientY);
    return position;
}