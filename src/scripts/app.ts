import { UI } from "./ui";
import { GravityAnimationController } from "./gravity-animation-controller";

export class App {
    private _ui: UI;
    private _gravityAnimationController: GravityAnimationController;
    //#region get, set
    get gravityAnimationController() {
        return this._gravityAnimationController;
    }
    set gravityAnimationController(controller: GravityAnimationController) {
        this._gravityAnimationController = controller;
    }
    get ui() {
        return this._ui;
    }
    //#endregion
    constructor() {
        this._gravityAnimationController = new GravityAnimationController(this);        
        this._ui = new UI(this);
        this.initialize();
    }
    private initialize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.gravityAnimationController.initialize(width, height);
        this.ui.initialize(width, height);
    }
    //#region control
    public run() {
        this.gravityAnimationController.run();
        this.ui.simulationResumed();
    }
    public stop() {
        this.gravityAnimationController.stop();
        this.ui.simulationStopped();
    }
    public advanceOneTick() {
        this.gravityAnimationController.advanceOneTick();
        this.updateStatusBarSimulationInfo();
    }
    public reset() {
        this.gravityAnimationController.reset();
        this.updateStatusBarSimulationInfo();
    }
    /**
     * Updates the status fields for tick count, number of bodies
     */
    public updateStatusBarSimulationInfo() {
        this.ui.updateStatusBarTickCount(this.gravityAnimationController.tickCount);
        this.ui.updateStatusBarBodyCount(this.gravityAnimationController.bodyCount);
    }
    public updateStatusBarAnimationInfo() {
        this.ui.updateStatusBarZoom(this.gravityAnimationController.currentZoom);
    }
    //#endregion
    public resizeCanvas(windowWidth: number, windowHeight: number) {
        this.gravityAnimationController.resizeCanvas(windowWidth, windowHeight);
        this.ui.updateStatusBarCanvasDimensions(windowWidth, windowHeight);
    }
}
//#endregion
