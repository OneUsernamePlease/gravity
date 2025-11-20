import { Vector2D } from "./vector2d";
import { MouseButton, ButtonState, Mouse, MouseButtons } from "./types";
import { Canvas } from "./canvas";
import * as util from "./essentials";
import { App } from "./app";
import * as c from "../const";

let app: App;
const mouse: Mouse = { main: { state: ButtonState.Up, downCoordinates: null }, 
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
    
    document.addEventListener("mousedown", mouseDown);
    window.addEventListener("resize", windowResized);
}

function windowResized(this: Window, ev: UIEvent) {
    let windowWidth = this.innerWidth;
    let windowHeight = this.innerHeight;
    app.resizeCanvas(windowWidth, windowHeight);
}

function mouseDown(this: Document, ev: MouseEvent) {
    if (ev.button === MouseButtons.Main) {
        c.mouse.main.state = ButtonState.Down;
        c.mouse.main.downCoordinates = { x: ev.clientX, y: ev.clientY };

    } else if (ev.button === MouseButtons.Wheel) {
        c.mouse.wheel.state = ButtonState.Down;
        c.mouse.wheel.downCoordinates = { x: ev.clientX, y: ev.clientY };

    } else if (ev.button === MouseButtons.Secondary) {
        c.mouse.secondary.state = ButtonState.Down;
        c.mouse.secondary.downCoordinates = { x: ev.clientX, y: ev.clientY };
    }
}
// functions that are not listeners

function canvasTouchStart(this: HTMLElement, ev: TouchEvent) {
    //app.canvasTouchStart(ev);
}
function canvasTouchMove(this: HTMLElement, ev: TouchEvent) {
    //app.canvasTouchMove(ev); // toDo
}
function canvasTouchEnd(this: HTMLElement, ev: TouchEvent) {
    //app.canvasTouchEnd(ev);
}
