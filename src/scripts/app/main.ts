import { App } from "@/app/app.js";

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

function windowResized() {
    app.resizeCanvas();
}
