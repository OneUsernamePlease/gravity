import { ButtonState, MouseButtons } from "./types";
import { App } from "./app";
import { mouse } from "../const";

let app: App;

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    app = new App();
    registerEvents();

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

