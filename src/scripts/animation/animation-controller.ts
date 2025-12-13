import { BACKGROUND_COLOR, DEFAULT_SCROLL_RATE, DEFAULT_ZOOM_FACTOR, MAX_ZOOM, MIN_DISPLAYED_RADIUS, MIN_ZOOM, VECTOR_COLORS } from "../const/const";
import { Canvas } from "./canvas";
import { Body2d } from "../simulation/body2d";
import { AnimationSettings, CanvasSpace, ObjectState, UIAnimationSettings } from "../types/types";
import { Vector2D } from "../util/vector2d";
import * as tfm from "../util/transformations";
import * as util from "../util/util";
import { ViewController } from "./view-controller";
import { App } from "../app/app";

/**
 * This class deals with everything animation related.
 */
export class AnimationController {
//#region properties
    private _canvasSpace: CanvasSpace;
    private _animationSettings: AnimationSettings;
    private _viewController: ViewController;
    private _running: boolean;
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
        private _app: App
    ) {
        this._animationSettings = { frameLength: 25, displayVectors: true, tracePaths: true };
        this._canvasSpace = {origin: new Vector2D(0, 0), currentZoom: 1, orientationY: -1};
        this._viewController = new ViewController(this);
        this._running = false;
    }
    public initialize(width: number, height: number, animationSettings: UIAnimationSettings) {
        this.canvas.visibleCanvas.width = width;
        this.canvas.visibleCanvas.height = height;

        // REFACTOR ME: apply settings after initialization
        this.animationSettings.displayVectors = animationSettings.displayVectors;
        
        // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
        // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
    }
    public run() {
        if (this.running) {
            return;
        }
        this.running = true;
        const loop = () => {
            if (this.running) {
                setTimeout(loop, this.animationSettings.frameLength);
                this.redrawSimulationState(this.app.currentSimulationState, this.animationSettings);
                this._app.updateStatusBarSimulationInfo();
            }
        };
        loop();
    }
    public stop() {
        this.running = false;
    }
    private drawBodies(objectStates: ObjectState[]) {
        objectStates.forEach(object => {
            this.drawBody(object.body, tfm.pointFromSimulationToCanvas(object.position, this.canvasSpace));
        });
    }
    private drawBody(body: Body2d, position: Vector2D) {
        let visibleRadius = Math.max(body.radius / this.currentZoom, MIN_DISPLAYED_RADIUS);
        this.canvas.drawCircle(position, visibleRadius, body.color);
    }
    public redrawSimulationState(objectStates: ObjectState[], animationSettings: AnimationSettings) {
        this.canvas.clear();
        this.canvas.fillCanvas(BACKGROUND_COLOR);
        this.drawBodies(objectStates);
        if (animationSettings.displayVectors) {
            this.drawVectors(objectStates);
        }
    }
    private drawVectors(objectStates: ObjectState[]) {
        objectStates.forEach(objectState => {
            const positionOnCanvas = tfm.pointFromSimulationToCanvas(objectState.position, this.canvasSpace);
            const accelerationOnCanvas = tfm.directionFromSimulationToCanvas(objectState.acceleration, this.canvasSpace);
            const velocityOnCanvas = tfm.directionFromSimulationToCanvas(objectState.velocity, this.canvasSpace);
            
            this.canvas.drawVector(positionOnCanvas, accelerationOnCanvas, VECTOR_COLORS.get("acceleration")?.hex);
            this.canvas.drawVector(positionOnCanvas, velocityOnCanvas, VECTOR_COLORS.get("velocity")?.hex);
        });
    }
    public setDisplayVectors(display: boolean) {
        this.animationSettings.displayVectors = display;
    }
    public resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
    }

    public scrollRight(distance?: number) {
    if (!distance) {
        distance = this.scrollDistance("horizontal"); // in simulationUnits
    }
    this.viewController.scroll({x: distance, y: 0});
    }
    public scrollLeft(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal"); // in simulationUnits
        }
        this.viewController.scroll({x: -distance, y: 0});
    }
    public scrollUp(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.viewController.scroll({x: 0, y: distance});
    }
    public scrollDown(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.viewController.scroll({x: 0, y: -distance});
    }
    private scrollDistance(orientation: "horizontal" | "vertical", rate: number = DEFAULT_SCROLL_RATE): number {
        switch (orientation) {
            case "horizontal":
                return this.width * rate * this.canvasSpace.currentZoom;
            case "vertical":
                return this.height * rate * this.canvasSpace.currentZoom;
        }
    }
    public zoomIn(
        zoomCenter: Vector2D = new Vector2D(this.width / 2, this.height / 2),
        factor: number = DEFAULT_ZOOM_FACTOR, 
    ): number {

        return this.zoomToFactor(1 - factor, zoomCenter);
    }
    public zoomOut(
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
    public zoomToFactor(factor: number, zoomCenter?: Vector2D): number {
        if (!zoomCenter) zoomCenter = new Vector2D(this.width / 2, this.height / 2);
        
        this.app.updateStatusBarAnimationInfo();
        
        return this.viewController.zoomToFactor(factor, zoomCenter);
    }
    public scrollInCanvasUnits(movementOnCanvas: Vector2D){
        const movementInSimulationUnits = movementOnCanvas.scale(this.currentZoom);
        this.viewController.scroll({ x: -(movementInSimulationUnits.x), y: movementInSimulationUnits.y });
    }
}