import { App } from "./app";

let app: App;

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    app = new App();
    registerEvents();

    app.run();
}

function registerEvents() {
    document.removeEventListener("DOMContentLoaded", initialize);
    window.addEventListener("resize", windowResized);
}

function windowResized(this: Window, ev: UIEvent) {
    let windowWidth = this.innerWidth;
    let windowHeight = this.innerHeight;
    app.resizeCanvas(windowWidth, windowHeight);
}
