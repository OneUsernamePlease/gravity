import { DEFAULT_SCROLL_RATE, DEFAULT_ZOOM_FACTOR, VECTOR_COLORS } from "../const/const.js";
import { Canvas } from "./canvas.js";
import { AnimationSettings, CanvasSpace, ObjectState, UIAnimationSettings } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import { ViewController } from "./view-controller.js";
import { App } from "../app/app.js";
import { Paths } from "./paths.js";

/**
 * This class deals with everything animation related.
 */
export class AnimationController {
//#region properties
    private _animationSettings: AnimationSettings;
    private _viewController: ViewController;
    private _running: boolean;
    private _paths: Paths;
//#endregion
//#region get, set
    private get canvas(): Canvas {
        return this._canvas;
    }
    private set canvas(canvas: Canvas) {
        this._canvas = canvas;
    }

    private get viewController() {
        return this._viewController;
    }

    get animationSettings(): AnimationSettings {
        return this._animationSettings;
    }
    set animationSettings(animationSettings: AnimationSettings) {
        this._animationSettings = animationSettings;
    }

    get canvasSpace() {
        return this._canvasSpace;
    }
    private set canvasSpace(canvasSpace: CanvasSpace) {
        this._canvasSpace = canvasSpace;
    }

    private get app() {
        return this._app;
    }

    get running() {
        return this._running;
    }
    private set running(running: boolean) {
        this._running = running;
    }
    // additional getters
    get currentZoom(): number {
        return this.canvasSpace.currentZoom;
    }
    get width(): number {
        return this.canvas.width;
    }
    get height(): number {
        return this.canvas.height;
    }
//#endregion
    constructor(
        private _canvas: Canvas, 
        private _app: App,
        private _canvasSpace: CanvasSpace,
    ) {
        this._animationSettings = { frameLength: 25, displayVectors: true, tracePaths: true };
        this._viewController = new ViewController(this);
        this._paths = new Paths(this);
        this._running = false;
    }
    initialize(width: number, height: number, animationSettings: UIAnimationSettings) {
        this.resizeCanvas(width, height);
        this.canvas.fillBackground();
        this.animationSettings.displayVectors = animationSettings.displayVectors;
        this.animationSettings.tracePaths = animationSettings.tracePaths;
    }
    run() {
        if (this.running) {
            return;
        }
        this.running = true;
        const loop = () => {
            if (this.running) {
                setTimeout(loop, this.animationSettings.frameLength);
                this.redrawSimulationState(this.app.currentSimulationState, this.animationSettings);
                this.app.updateStatusBarSimulationInfo();
            }
        };
        loop();
    }
    stop() {
        this.running = false;
    }
    private drawBodies(objectStates: Map<number, ObjectState>) {
        objectStates.forEach(objectState => {
            const body = objectState.body;
            this.canvas.drawBody(objectState.position, body.radius, body.color);
        });
    }
    tracePaths(objectStates: Map<number, ObjectState>) {
        this._paths.addSegments(objectStates);
        const paths = Array.from(this._paths.pathArrays);
        const pathsOnCanvas: Vector2D[][] = new Array(paths.length);
        
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            pathsOnCanvas[i] = path.toVectorArray();
        }

        this.canvas.drawPaths(pathsOnCanvas);
    }
    redrawSimulationState(objectStates: Map<number, ObjectState>, animationSettings: AnimationSettings) {
        this.canvas.clearSimulation();
        this.drawBodies(objectStates);
        if (animationSettings.displayVectors) {
            this.drawVectors(objectStates);
        }
        if (animationSettings.tracePaths) {
            this.canvas.clearPaths();
            this.tracePaths(objectStates);
        }
    }
    private drawVectors(objectStates: Map<number, ObjectState>) {
        objectStates.forEach(objectState => {
            const position = objectState.position;
            const acceleration = objectState.acceleration;
            const velocity = objectState.velocity;

            this.canvas.drawVector(position, acceleration, VECTOR_COLORS.get("acceleration")?.hex);
            this.canvas.drawVector(position, velocity, VECTOR_COLORS.get("velocity")?.hex);
        });
    }
    setDisplayVectors(display: boolean) {
        this.animationSettings.displayVectors = display;
    }
    setTracePaths(tracePaths: boolean) {
        this.animationSettings.tracePaths = tracePaths;
    }
    resetPaths() {
        this._paths.clear();
        this.canvas.clearPaths();
    }
    resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
    }

    scrollRight(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal"); // in simulationUnits
        }
        this.viewController.moveOrigin(new Vector2D(distance, 0));
    }
    scrollLeft(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal"); // in simulationUnits
        }
        this.viewController.moveOrigin(new Vector2D(-distance, 0));
    }
    scrollUp(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.viewController.moveOrigin(new Vector2D(0, distance));
    }
    scrollDown(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.viewController.moveOrigin(new Vector2D(0, -distance));
    }
    private scrollDistance(orientation: "horizontal" | "vertical", rate: number = DEFAULT_SCROLL_RATE): number {
        switch (orientation) {
            case "horizontal":
                return this.width * rate * this.canvasSpace.currentZoom;
            case "vertical":
                return this.height * rate * this.canvasSpace.currentZoom;
        }
    }
    zoomIn(
        zoomCenter: Vector2D = new Vector2D(this.width / 2, this.height / 2),
        factor: number = DEFAULT_ZOOM_FACTOR, 
    ): number {
        return this.zoomToFactor(1 - factor, zoomCenter);
    }
    zoomOut(
        zoomCenter: Vector2D = new Vector2D(this.width / 2, this.height / 2),
        factor: number = DEFAULT_ZOOM_FACTOR, 
    ): number {
        return this.zoomToFactor(1 + factor, zoomCenter);
    }
    /**
     * 
     * @param factor if this is 0 or less, nothing happens
     * @param zoomCenter 
     * @returns the new zoom level (in meter/pixel).
     */
    zoomToFactor(factor: number, zoomCenter?: Vector2D): number {
        if (!zoomCenter) zoomCenter = new Vector2D(this.width / 2, this.height / 2);
        
        this.app.updateStatusBarAnimationInfo();
        
        return this.viewController.zoomToFactor(factor, zoomCenter);
    }
    scrollInCanvasUnits(movementOnCanvas: Vector2D) {
        const movementInSimulationUnits = movementOnCanvas.scale(this.currentZoom);
        this.viewController.moveOrigin(movementInSimulationUnits.hadamardProduct(new Vector2D(-1, 1)));
    }
}
