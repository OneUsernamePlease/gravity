import { UI } from "../interaction/ui";
import { GravityAnimationController } from "../simulation/gravity-animation-controller";

export class App {
//#region properties
    private _ui: UI;
    private _gravityAnimationController: GravityAnimationController;
//#endregion
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
//#region initialize
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
//#endregion
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
        this.ui.updateStatusBarSimulationInfo();
    }
    public reset() {
        this.gravityAnimationController.reset();
        this.ui.updateStatusBarSimulationInfo();
    }
    public resizeCanvas(windowWidth: number, windowHeight: number) {
        this.gravityAnimationController.resizeCanvas(windowWidth, windowHeight);
        this.ui.updateStatusBarCanvasDimensions(windowWidth, windowHeight);
    }
}
//#endregion
