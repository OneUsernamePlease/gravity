import { UI } from "../ui/ui.js";
import { Gravity } from "../simulation/gravity.js";
import { AnimationController } from "../animation/animation-controller.js";
import { InteractionManager } from "./interaction-manager.js";
import { Canvas } from "../animation/canvas.js";
import { ObjectState, PerformanceInfo, SimulationSettings } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import { Body2d } from "../simulation/body2d.js";
import { DEFAULT_ZOOM_FACTOR } from "../const/const.js";
import { StatusStore } from "../ui/statusBar.js";

export class App {
//#region properties
    private _gravity: Gravity;
    private _animation: AnimationController;
    private _interaction: InteractionManager;
    private _ui: UI;
    readonly status: StatusStore = new StatusStore();
//#endregion
//#region get
    get simulationRunning() {
        return this._gravity.running;
    }
    get currentSimulationState() {
        return this._gravity.simulationState;
    }
    get currentTick(): number {
        return this._gravity.tick;
    }
    get currentZoom(): number {
        return this._animation.currentZoom;
    }
    get selectedClickAction(): string {
        return this._ui.selectedClickAction;
    }
    get simulationMetrics(): PerformanceInfo {
        return { 
            ticksLastSecond: this._gravity.ticksLastSecond,
            averageTicksPerSecond: this._gravity.averageTicksPerSecond,
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
        this._animation.initialize(this._ui.animationSettings);
        this.applySimulationSettings(this._ui.simulationSettings);

        this.status.setCanvasSize(this.canvasWidth, this.canvasHeight);
        this.status.setZoom(this.currentZoom);
        
        this._animation.run();
    }
//#endregion
// sim controls
    run() {
        this._gravity.run();
        this._ui.simulationResumed();
    }
    stop() {
        this._gravity.stop();
        this._ui.simulationStopped();
    }
    advanceOneTick() {
        this._gravity.advanceTick();
        
        this.status.setTickInfo(this.currentTick, this.simulationMetrics);
        this.status.setBodyCount(this.currentSimulationState.size);
    }
    resetSimulation() {
        this._gravity.reset();
        this._animation.resetPaths();
        
        this.status.setTickInfo(this.currentTick, this.simulationMetrics);
        this.status.setBodyCount(this.currentSimulationState.size);
    }
    applySimulationSettings(simulationSettings: SimulationSettings) {
        this._gravity.applySettings(simulationSettings);
    }    
    addObject(objectState: ObjectState) {
        return this._gravity.addObject(objectState);
    }
// animation controls    
    zoomToFactor(zoomFactor: number, zoomCenterCanvas?: Vector2D) {
        this._animation.zoomToFactor(zoomFactor, zoomCenterCanvas);
        
        this.status.setZoom(this.currentZoom);
    }
    zoomIn(zoomCenter = new Vector2D(this.canvasWidth / 2, this.canvasHeight / 2), factor = DEFAULT_ZOOM_FACTOR) {
        this._animation.zoomIn(zoomCenter, factor);
        
        this.status.setZoom(this.currentZoom);
    }
    zoomOut(zoomCenter = new Vector2D(this.canvasWidth / 2, this.canvasHeight / 2), factor = DEFAULT_ZOOM_FACTOR) {
        this._animation.zoomOut(zoomCenter, factor);
        this.status.setZoom(this.currentZoom);
    }
    scrollUp() {
        this._animation.scrollUp();
    }
    scrollDown() {
        this._animation.scrollDown();
    }
    scrollLeft() {
        this._animation.scrollLeft();
    }
    scrollRight() {
        this._animation.scrollRight();
    }
    resizeCanvas() {
        this._animation.resizeCanvas();
        
        this.status.setCanvasSize(this._animation.width, this._animation.height);
    }
    setDisplayVectors(display: boolean) {
        this._animation.setDisplayVectors(display);
    }
    setTracePaths(tracePaths: boolean) {
        this._animation.setTracePaths(tracePaths);
    }
    setDisplayCoordinateSystem(displayCoordinateSystem: boolean) {
        this._animation.setDisplayCoordinateSystem(displayCoordinateSystem);
    }
// UI related
    updateStatus() {
        this.status.setTickInfo(
            this.currentTick,
            this.simulationMetrics,
        );

        this.status.setBodyCount(
            this.currentSimulationState.size,
        );

        this.status.setZoom(this.currentZoom);
    }
    body2dFromUi(): Body2d {
        const bodyInfo = this._ui.bodyInformation;
        return new Body2d(bodyInfo.mass, bodyInfo.movable);
    }
    closeStatusBarPopover() {
        this._ui.closeStatusBarPopover();
    }
}
