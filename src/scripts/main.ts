import { ButtonState, MouseButtons } from "./types";
import { App } from "./app";
import * as c from "../const";

let app: App;

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    registerEvents();
    app = new App();
    app.run();
}

function registerEvents() {
    document.removeEventListener("DOMContentLoaded", initialize);
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

