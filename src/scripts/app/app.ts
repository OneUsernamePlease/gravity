import { UI } from "../interaction/ui";
import { Gravity } from "../simulation/gravity";
import { AnimationController } from "../animation/animation-controller";
import { InteractionManager } from "../interaction/interaction-manager";
import { Canvas } from "../animation/canvas";

export class App {
//#region properties
private _gravity: Gravity;
private _animation: AnimationController;
private _interaction: InteractionManager;
private _ui: UI;
//#endregion
//#region get, set
    get gravity() {
        return this._gravity;
    }
    get animation() {
        return this._animation;
    }
    get interaction() {
        return this._interaction;
    }
    get ui() {
        return this._ui;
    }
    get running() {
        return this.gravity.running;
    }
//#endregion
//#region initialize
    constructor() {
        const canvasElement = document.getElementById("theCanvas") as HTMLCanvasElement;
        if (!canvasElement) throw new Error("canvasElement not found");
        const canvas = new Canvas(canvasElement);

        this._gravity = new Gravity();        
        this._animation = new AnimationController(canvas, this);        
        this._ui = new UI(this);
        this._interaction = new InteractionManager(canvas, this);
        this.initialize();
    }
    private initialize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.animation.initialize(width, height, this.ui.animationSettings);
        this.gravity.setCollisions(this.ui.collisionDetection, this.ui.elasticCollisions);
        this.ui.initialize(width, height);
        
        this.animation.run();
    }
//#endregion
//#region control
    public run() {
        this.gravity.run();
        this.ui.simulationResumed();
    }
    public stop() {
        this.gravity.stop();
        this.ui.simulationStopped();
    }
    public advanceOneTick() {
        this.gravity.advanceTick();
        this.ui.updateStatusBarSimulationInfo();
    }
    public reset() {
        this.gravity.reset();
        this.ui.updateStatusBarSimulationInfo();
    }
    public resizeCanvas(windowWidth: number, windowHeight: number) {
        this.animation.resizeCanvas(windowWidth, windowHeight);
        this.ui.updateStatusBarCanvasDimensions(windowWidth, windowHeight);
    }

    public zoomIn() {
        this.animation.zoomIn()
    }

}
//#endregion
