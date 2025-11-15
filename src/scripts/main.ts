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
    app = new App(c.CANVAS_ID);
    app.initialize();
}
function registerEvents() {
    document.getElementById("btnToggleSim")?.addEventListener("click", toggleSimulationClicked);
    document.getElementById("btnNextStep")?.addEventListener("click", nextStepClicked);
    document.getElementById("btnResetSim")?.addEventListener("click", resetClicked);
    document.getElementById("btnZoomOut")?.addEventListener("click", zoomOutClicked);
    document.getElementById("btnZoomIn")?.addEventListener("click", zoomInClicked);
    document.getElementById("btnScrollLeft")?.addEventListener("click", scrollLeftClicked);
    document.getElementById("btnScrollRight")?.addEventListener("click", scrollRightClicked);
    document.getElementById("btnScrollUp")?.addEventListener("click", scrollUpClicked);
    document.getElementById("btnScrollDown")?.addEventListener("click", scrollDownClicked);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mousedown", canvasMouseDown);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mouseup", canvasMouseUp);
    //document.getElementById(c.CANVAS_ID)?.addEventListener("mouseout", canvasMouseOut);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mousemove", canvasMouseMoving);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchstart", canvasTouchStart);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchend", canvasTouchEnd);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchmove", canvasTouchMove);
    document.getElementById(c.CANVAS_ID)?.addEventListener("wheel", canvasMouseWheel);
    document.getElementById(c.CANVAS_ID)?.addEventListener("contextmenu", (ev) => {ev.preventDefault()});
    document.getElementById(c.MASS_INPUT_ID)?.addEventListener("change", massInputChanged);
    document.getElementById("cbxDisplayVectors")?.addEventListener("change", cbxDisplayVectorsChanged);
    document.getElementById("cbxCollisions")?.addEventListener("change", cbxCollisionsChanged);
    document.getElementById("cbxElasticCollisions")?.addEventListener("change", cbxElasticCollisionsChanged);
    document.getElementById("rangeG")?.addEventListener("input", rangeInputGChanged);
    document.getElementById("numberG")?.addEventListener("input", numberInputGChanged);
    document.querySelectorAll('input[name="radioBtnMouseAction"]').forEach((radioButton) => {
        radioButton.addEventListener('change', radioBtnMouseActionChanged);
        });
    document.addEventListener("mousedown", mouseDown);
    window.addEventListener("resize", windowResized);
}
function zoomOutClicked(this: HTMLElement, ev: MouseEvent) {
    app.zoomOutClicked();
}
function zoomInClicked(this: HTMLElement, ev: MouseEvent) {
    app.zoomInClicked();
}
function scrollLeftClicked(this: HTMLElement, ev: MouseEvent) {
    app.scrollViewLeft();
}
function scrollRightClicked(this: HTMLElement, ev: MouseEvent) {
    app.scrollViewRight();
}
function scrollUpClicked(this: HTMLElement, ev: MouseEvent) {
    app.scrollViewUp();
}
function scrollDownClicked(this: HTMLElement, ev: MouseEvent) {
    app.scrollViewDown();
}
function massInputChanged(this: HTMLElement) {
    const input = this as HTMLInputElement;
    app.massInputChanged(input);
}
function cbxCollisionsChanged(this: HTMLElement, ev: Event) {
    const checkbox = this as HTMLInputElement;
    app.cbxCollisionsChanged(checkbox);
}
function cbxElasticCollisionsChanged(this: HTMLElement, ev: Event) {
    const checkbox = this as HTMLInputElement;
    app.cbxElasticCollisionsChanged(checkbox);
}
function cbxDisplayVectorsChanged(this: HTMLElement, ev: Event) {
    const checkbox = this as HTMLInputElement;
    app.cbxDisplayVectorsChanged(checkbox);
}
function radioBtnMouseActionChanged(this: HTMLElement, ev: Event): void {
    const radio = this as HTMLInputElement;
    app.radioBtnMouseActionChanged(radio);
}
function toggleSimulationClicked(this: HTMLElement, ev: MouseEvent) {
    app.toggleSimulation();
}
function rangeInputGChanged(this: HTMLElement, ev: Event) {
    const input = this as HTMLInputElement;
    app.rangeInputGChanged(input);
}
function numberInputGChanged(this: HTMLElement, ev: Event) {
    const input = this as HTMLInputElement;
    app.numberInputGChanged(input);
}
function nextStepClicked() {
    app.advanceOneTick();
}
function resetClicked() {
    app.reset();
}
function windowResized(this: Window, ev: UIEvent) {
    let windowWidth = this.innerWidth;
    let windowHeight = this.innerHeight;
    app.resizeCanvas(windowWidth, windowHeight);
}
function canvasMouseDown(this: HTMLElement, ev: MouseEvent) {
    if (ev.button === MouseButtons.Main) {
        const absoluteMousePosition: Vector2D = getAbsoluteMousePosition(ev);
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
    switch (ev.button) {
        case MouseButtons.Main:
            const absoluteMousePosition: Vector2D = getAbsoluteMousePosition(ev);
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
function canvasMouseOut(this: HTMLElement, ev: MouseEvent) {
    // probably not needed any more
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
    
    const canvasRect = this.getBoundingClientRect();
    const cursorPos = new Vector2D(ev.clientX - canvasRect.left, ev.clientY - canvasRect.top);
    
    if (ev.deltaY < 0) {
        app.zoomIn(cursorPos);
    } else if (ev.deltaY > 0) {
        app.zoomOut(cursorPos);
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
function getAbsoluteMousePosition(ev: MouseEvent): Vector2D {
    const position = new Vector2D(ev.clientX,  ev.clientY);
    return position;
}