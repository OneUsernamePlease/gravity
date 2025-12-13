import { UI } from "../interaction/ui";
import { Gravity } from "../simulation/gravity";
import { AnimationController } from "../animation/animation-controller";
import { InteractionManager } from "../interaction/interaction-manager";
import { Canvas } from "../animation/canvas";
import { CanvasSpace, SimulationSettings } from "../types/types";
import { Vector2D } from "../util/vector2d";
import { Body2d } from "../simulation/body2d";

export class App {


//#region properties
    private _gravity: Gravity;
    private _animation: AnimationController;
    private _interaction: InteractionManager;
    private _ui: UI;
//#endregion
//#region get
    private get gravity() {
        return this._gravity;
    }
    private get animation() {
        return this._animation;
    }
    private get interaction() {
        return this._interaction;
    }
    private get ui() {
        return this._ui;
    }

    get simulationRunning() {
        return this.gravity.running;
    }
    get currentSimulationState() {
        return this.gravity.simulationState;
    }
    get canvasSpace(): CanvasSpace {
        return this.animation.canvasSpace;
    }
    get selectedClickAction(): string {
        return this.ui.selectedClickAction;
    }
    get tick(): number {
        return this.gravity.tick;
    }
    get currentZoom(): number {
        return this.animation.currentZoom;
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
        this._interaction = new InteractionManager(canvas.visibleCanvas, this);
        this.initialize();
    }
    private initialize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.animation.initialize(width, height, this.ui.animationSettings);
        this.applySimulationSettings(this.ui.simulationSettings);
        this.ui.initialize(width, height);
        
        this.animation.run();
    }
//#endregion
// sim controls
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
    public resetSimulation() {
        this.gravity.reset();
        this.ui.updateStatusBarSimulationInfo();
    }
    public applySimulationSettings(simulationSettings: SimulationSettings) {
        this.gravity.applySettings(simulationSettings);
    }    
    public addBody(bodyBeingAdded: Body2d, mousePositionInSimSpace: Vector2D, vel: Vector2D) {
        return this.gravity.addBody(bodyBeingAdded, mousePositionInSimSpace, vel);
    }
// animation controls    
    public zoomToFactor(zoomFactor: number, zoomCenterCanvas: Vector2D) {
        this.animation.zoomToFactor(zoomFactor, zoomCenterCanvas);
    }
    public zoomIn(zoomCenter?: Vector2D) {
        this.animation.zoomIn(zoomCenter);
    }
    public zoomOut(zoomCenter?: Vector2D) {
        this.animation.zoomOut(zoomCenter);
    }
    public scrollInCanvasUnits(scroll: Vector2D) {
        this.animation.scrollInCanvasUnits(scroll);
    }
    public scrollUp() {
        this.animation.scrollUp();
    }
    public scrollDown() {
        this.animation.scrollDown();
    }
    public scrollLeft() {
        this.animation.scrollLeft();
    }
    public scrollRight() {
        this.animation.scrollRight();
    }
    public resizeCanvas(windowWidth: number, windowHeight: number) {
        this.animation.resizeCanvas(windowWidth, windowHeight);
        this.ui.updateStatusBarCanvasDimensions(windowWidth, windowHeight);
    }
    public setDisplayVectors(display: boolean) {
        this.animation.setDisplayVectors(display);
    }
// UI related
    public updateStatusBarAnimationInfo() {
        this.ui.updateStatusBarAnimationInfo();
    }
    public updateStatusBarSimulationInfo() {
        this.ui.updateStatusBarSimulationInfo();
    }
    public body2dFromUi(): Body2d {
        const bodyInfo = this.ui.bodyInformation;
        return new Body2d(bodyInfo.mass, bodyInfo.movable);
    }
}
