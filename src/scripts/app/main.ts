import { App } from "../app/app.js";

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
/*function registerModules() {
    const canvasId = "theCanvas"
    const canvasElement = document.getElementById(canvasId);
    
    if (!(canvasElement instanceof HTMLCanvasElement)) {
        throw new Error(`no canvas-Element with id "${canvasId}" found.`);
    }
    
    container.register(App, (c) => {
        const gravityController             = c.resolve(Gravity);
        const animationController           = c.resolve(AnimationController);
        const interaction                   = c.resolve(InteractionManager);
        const ui                            = c.resolve(UI);
        return new App(gravityAnimationController, gravityController, animationController, interaction, ui);
    });
    container.register(InteractionManager, (c) => {
        const app = c.resolve(App);
        const canvas = c.resolve(Canvas);
        return new InteractionManager(canvas, app);
    });
    container.register(UI, (c) => {
        const app = c.resolve(App);
        return new UI(app);
    });
    container.register(Gravity, (c) => {
        return new Gravity();
    });
    container.register(GravitySimulation, (c) => {
        return new GravitySimulation();
    });
    container.register(AnimationController, (c) => {
        const gac = c.resolve(GravityAnimationController);
        return new AnimationController(canvas, gac);
    });
    container.register(Canvas, (c) => {
        return new Canvas(canvasElement);
    });

    const canvas = container.resolve(Canvas);
    app = container.resolve(App);
}*/