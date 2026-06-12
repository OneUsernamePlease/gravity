import { UI } from "../interaction/ui/ui.js";
import { Gravity } from "../simulation/gravity.js";
import { AnimationController } from "../animation/animation-controller.js";
import { InteractionManager } from "../interaction/interaction-manager.js";
import { Canvas } from "../animation/canvas.js";
import { ObjectState, PerformanceInfo, SimulationSettings } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import { Body2d } from "../simulation/body2d.js";
import { DEFAULT_ZOOM_FACTOR } from "../const/const.js";

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
    get currentTick(): number {
        return this.gravity.tick;
    }
    get currentZoom(): number {
        return this.animation.currentZoom;
    }
    get selectedClickAction(): string {
        return this.ui.selectedClickAction;
    }
    get simulationMetrics(): PerformanceInfo {
        return { 
            ticksLastSecond: this.gravity.ticksLastSecond,
            averageTicksPerSecond: this.gravity.averageTicksPerSecond,
        }
    }
    get canvasWidth() {
        return this._animation.width;
    }
    get canvasHeight() {
        return this._animation.height;
    }
//#endregion
//#region initialize
    constructor() {
        const wrapper = document.getElementById("canvasWrapper") as HTMLDivElement;
        if (!wrapper) {
            throw new Error("canvasWrapper not found");
        }
        const canvas = new Canvas(wrapper, this);
        this._gravity = new Gravity();        
        this._animation = new AnimationController(canvas, this);        
        this._ui = new UI(this);
        this._interaction = new InteractionManager(canvas, this);
        this.initialize();
    }
    private initialize() {
        this.animation.initialize(this.ui.animationSettings);
        this.applySimulationSettings(this.ui.simulationSettings);
        this.ui.initialize(this._animation.width, this._animation.height);
        
        this.animation.run();
    }
//#endregion
// sim controls
    run() {
        this.gravity.run();
        this.ui.simulationResumed();
    }
    stop() {
        this.gravity.stop();
        this.ui.simulationStopped();
    }
    advanceOneTick() {
        this.gravity.advanceTick();
        this.ui.updateStatusBarSimulationInfo();
    }
    resetSimulation() {
        this.gravity.reset();
        this.animation.resetPaths();
        this.ui.updateStatusBarSimulationInfo();
    }
    applySimulationSettings(simulationSettings: SimulationSettings) {
        this.gravity.applySettings(simulationSettings);
    }    
    addObject(objectState: ObjectState) {
        return this.gravity.addObject(objectState);
    }
// animation controls    
    zoomToFactor(zoomFactor: number, zoomCenterCanvas?: Vector2D) {
        this.animation.zoomToFactor(zoomFactor, zoomCenterCanvas);
        this.ui.updateStatusBarAnimationInfo();
    }
    zoomIn(zoomCenter = new Vector2D(this.canvasWidth / 2, this.canvasHeight / 2), factor = DEFAULT_ZOOM_FACTOR) {
        this.animation.zoomIn(zoomCenter, factor);
        this.ui.updateStatusBarAnimationInfo();
    }
    zoomOut(zoomCenter = new Vector2D(this.canvasWidth / 2, this.canvasHeight / 2), factor = DEFAULT_ZOOM_FACTOR) {
        this.animation.zoomOut(zoomCenter, factor);
        this.ui.updateStatusBarAnimationInfo();
    }
    scrollUp() {
        this.animation.scrollUp();
    }
    scrollDown() {
        this.animation.scrollDown();
    }
    scrollLeft() {
        this.animation.scrollLeft();
    }
    scrollRight() {
        this.animation.scrollRight();
    }
    resizeCanvas() {
        this.animation.resizeCanvas();
        this.ui.updateStatusBarCanvasDimensions(this.animation.width, this.animation.height);
    }
    setDisplayVectors(display: boolean) {
        this.animation.setDisplayVectors(display);
        this.ui.displayVectorMessage(display);
    }
    setTracePaths(tracePaths: boolean) {
        this.animation.setTracePaths(tracePaths);
    }
    setDisplayCoordinateSystem(displayCoordinateSystem: boolean) {
        this.animation.setDisplayCoordinateSystem(displayCoordinateSystem);
    }
// UI related
    updateStatusBarAnimationInfo() {
        this.ui.updateStatusBarAnimationInfo();
    }
    updateStatusBarSimulationInfo() {
        this.ui.updateStatusBarSimulationInfo();
    }
    body2dFromUi(): Body2d {
        const bodyInfo = this.ui.bodyInformation;
        return new Body2d(bodyInfo.mass, bodyInfo.movable);
    }
}
