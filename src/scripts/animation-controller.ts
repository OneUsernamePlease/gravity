import { MAX_ZOOM, MIN_DISPLAYED_RADIUS, MIN_ZOOM } from "../const";
import { Canvas } from "./canvas";
import { Body2d } from "./gravity";
import { AnimationSettings, CanvasSpace, ObjectState, UIAnimationSettings } from "./types";
import { Vector2D } from "./vector2d";
import * as tfm from "./transformations";
import { GravityAnimationController } from "./gravity-animation-controller";
import * as util from "./essentials";
export class AnimationController {
    private _canvas: Canvas;
    private _canvasSpace: CanvasSpace;
    private _animationSettings: AnimationSettings;
    private _running: boolean;

//#region get, set
    get canvas(): Canvas {
        return this._canvas;
    }
    set canvas(canvas: Canvas) {
        this._canvas = canvas;
    }

    get animationSettings(): AnimationSettings {
        return this._animationSettings;
    }
    private set animationSettings(animationSettings: AnimationSettings) {
        this._animationSettings = animationSettings;
    }

    get canvasSpace() {
        return this._canvasSpace;
    }
    set canvasSpace(canvasSpace: CanvasSpace) {
        this._canvasSpace = canvasSpace;
    }

    get running() {
        return this._running;
    }
    set running(running: boolean) {
        this._running = running;
    }
    // additional getters
    get simulationState(): ObjectState[] {
        return this.gravityAnimationController.currentSimulationState;
    }
    get currentZoom(): number {
        return this.canvasSpace.currentZoom;
    }
    get width(): number {
        return this.canvas.visibleCanvas.width;
    }
    get height(): number {
        return this.canvas.visibleCanvas.height;
    }
        
//#endregion
    constructor(canvas: Canvas, private gravityAnimationController: GravityAnimationController) {
        this._animationSettings = { frameLength: 25, displayVectors: true, tracePaths: true };
        this._canvas = canvas;
        this._canvasSpace = {origin: new Vector2D(0, 0), currentZoom: 1, orientationY: -1};
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
                this.redrawSimulationState(this.simulationState, this.animationSettings);
                this.gravityAnimationController.updateStatusBarSimulationMessages();
            }
        };
        loop();
    }
    public stop() {
        this.running = false;
    }
    public redrawIfPaused() {
        if (!this.running) {
            this.redrawSimulationState(this.simulationState, this.animationSettings);
        }
    }
    public drawBodies(objectStates: ObjectState[]) {
        objectStates.forEach(object => {
            this.drawBody(object.body, tfm.pointFromSimulationSpaceToCanvasSpace(object.position, this.canvasSpace));
        });
    }
    public drawBody(body: Body2d, position: Vector2D) {
        let visibleRadius = Math.max(body.radius / this.currentZoom, MIN_DISPLAYED_RADIUS);
        this.canvas.drawCircle(position, visibleRadius, body.color);
    }
    public redrawSimulationState(objectStates: ObjectState[], animationSettings: AnimationSettings) {
        this.canvas.clear();
        this.drawBodies(objectStates);
        if (animationSettings.displayVectors) {
            this.drawVectors(objectStates);
        }
    }
    public drawVectors(objectStates: ObjectState[]) {
        objectStates.forEach(objectState => {
            const positionOnCanvas = tfm.pointFromSimulationSpaceToCanvasSpace(objectState.position, this.canvasSpace);
            const accelerationOnCanvas = tfm.directionFromSimulationSpaceToCanvasSpace(objectState.acceleration, this.canvasSpace);
            const velocityOnCanvas = tfm.directionFromSimulationSpaceToCanvasSpace(objectState.velocity, this.canvasSpace);
            
            this.canvas.drawVector(positionOnCanvas, accelerationOnCanvas, "green");
            this.canvas.drawVector(positionOnCanvas, velocityOnCanvas, "red");
        });
    }
    public setDisplayVectors(display: boolean) {
        this.animationSettings.displayVectors = display;
        this.redrawIfPaused();
    }
    public resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
        this.redrawIfPaused();
    }
    public setCanvasView(origin: Vector2D, zoom: number) { 
        this.setOrigin(origin);
        this.setZoom(zoom);
        this.gravityAnimationController.updateStatusBarAnimationInfo();
        this.redrawIfPaused();
    }
    private moveCanvas(displacement: { x: number; y: number }) {
        this.moveOrigin(displacement);
        this.redrawIfPaused();
    }
    public scroll(displacement: { x: number; y: number }) {
        this.moveCanvas(displacement);
    }
    /**
     * Origin {x:0,y:0} is at the top-left
     */
    public setOrigin(newOrigin: Vector2D) {
        this.canvasSpace.origin = newOrigin;
    }
    public moveOrigin(displacement: { x: number, y: number}) {
        const originPosition = this.canvasSpace.origin;
        const newOrigin = originPosition.add(displacement);
        this.setOrigin(newOrigin);
    }
    /**
     * Zoom is measured in simulationUnits (meter) per canvasUnit (pixel)
     * @param zoomCenter this point stays fixed while zooming
     * @param zoomStep the change of meter per pixel
     * @returns the new zoom level
     */
    public zoomOut(zoomCenter: Vector2D, zoomStep: number): number {
        if (this.currentZoom >= MAX_ZOOM) { 
            return this.currentZoom; 
        }

        let newZoom = this.currentZoom + zoomStep;
        if(newZoom > MAX_ZOOM) {
            newZoom = MAX_ZOOM;
            zoomStep = MAX_ZOOM - this.canvasSpace.currentZoom;
        }
        
        const shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        this.moveOrigin(shiftOrigin.hadamardProduct({x: -1, y: 1}));
        this.canvasSpace.currentZoom = newZoom;

        this.redrawIfPaused();

        return newZoom;
    }
    /**
     * Zoom is measured in simulationUnits (meter) per canvasUnit (pixel)
     * @param zoomCenter this point stays fixed while zooming
     * @param zoomStep the change in meter per pixel
     * @returns the new zoom level
     */
    public zoomIn(zoomCenter: Vector2D, zoomStep: number): number {
        if (this.currentZoom <= MIN_ZOOM) { 
            return this.currentZoom; 
        }

        let newZoom = this.canvasSpace.currentZoom - zoomStep;
        if (newZoom < MIN_ZOOM) {
            newZoom = MIN_ZOOM;
            zoomStep = this.canvasSpace.currentZoom - MIN_ZOOM;
        }
        
        const shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        this.moveOrigin(shiftOrigin.hadamardProduct({x: 1, y: -1}));
        this.canvasSpace.currentZoom = newZoom;

        this.redrawIfPaused();

        return newZoom;
    }
    public setZoom(newZoom: number) {
        newZoom = util.numberInRange(newZoom, MIN_ZOOM, MAX_ZOOM);
        this.canvasSpace.currentZoom = newZoom;
        
        this.redrawIfPaused();
    }
    public zoomToFactor(factor: number, zoomCenter?: Vector2D): number {
        if (factor <= 0) return this.currentZoom;
        if (!zoomCenter) {
            zoomCenter = new Vector2D(this.width / 2, this.height / 2);
        }

        const oldZoom = this.currentZoom;
        const newZoom = oldZoom * factor;
        const zoomDelta = newZoom - oldZoom;

        this.gravityAnimationController.updateStatusBarAnimationInfo();

        if (zoomDelta > 0) {
            return this.zoomIn(zoomCenter, zoomDelta);
        } else if (zoomDelta < 0) {
            return this.zoomOut(zoomCenter, -zoomDelta);
        } else {
            return oldZoom;
        }

    }


}