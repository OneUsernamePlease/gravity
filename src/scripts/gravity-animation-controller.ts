import { Canvas } from "./canvas";
import { Body2d, Simulation } from "./gravity";
import * as tsEssentials from "./essentials";
import { AnimationSettings } from "./types";
import * as c from "../const";
import { Vector2D } from "./vector2d";

export class GravityAnimationController {
    private _canvas: Canvas;
    private _simulation: Simulation;
    private _animationSettings: AnimationSettings;
    private _running: boolean;
    get canvas(): Canvas {
        return this._canvas;
    }
    set canvas(canvas: Canvas) {
        this._canvas = canvas;
    }
    get simulation(): Simulation {
        return this._simulation;
    }
    set simulation(simulation: Simulation) {
        this._simulation = simulation;
    }
    get animationSettings(): AnimationSettings {
        return this._animationSettings;
    }
    set animationSettings(animationSettings: AnimationSettings) {
        this._animationSettings = animationSettings;
    }
    get running(): boolean {
        return this._running;
    }
    private set running(running: boolean) {
        this._running = running;
    }
    // additional getters
    get tickCount(): number {
        return this.simulation.tickCount;
    }
    get bodyCount(): number {
        return this.simulation.simulationState.length;
    }
    get width(): number {
        return this.canvas.visibleCanvas.width;
    }
    get height(): number {
        return this.canvas.visibleCanvas.height;
    }
    get zoom(): number {
        return this.canvas.currentZoom;
    }
    constructor(canvas: Canvas) {
        this._canvas = canvas;
        this._simulation = new Simulation;
        this._animationSettings = { defaultScrollRate: 0.1, defaultZoomStep: 1, frameLength: 25, displayVectors: true, tracePaths: true };
        this._running = false;
    }

    //#region initialization
    public initialize(canvasDimensions: {x: number, y: number}) {
        this.initCanvas(canvasDimensions.x, canvasDimensions.y);
        this.initSimulation();
    }
    private initCanvas(width: number, height: number) {
        this.canvas.visibleCanvas.width = width;
        this.canvas.visibleCanvas.height = height;
        this.animationSettings.displayVectors = tsEssentials.isChecked("cbxDisplayVectors");
        
        // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
        // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
    }
    private initSimulation() {
        this.simulation.collisionDetection = tsEssentials.isChecked("cbxCollisions");
        this.simulation.elasticCollisions = tsEssentials.isChecked("cbxElasticCollisions");
    }
//#endregion

//#region control methods
    public run() {
        this.runSimulation();
        this.runAnimation();
    }
    public stop() {
        this.running = false;
        this.simulation.pause();
    }
    public toggle() {
        if (this.running) {
            this.stop();
        } else {
            this.run();
        }
    }
    public reset() {
        this.simulation.reset();
        this.redrawSimulation();
    }
    private runSimulation() {
        if (!this.running) {
            this.simulation.run();
            this.runAnimation();
        }
    }
    private runAnimation() {
        if (this.running) {
            return;
        }
        this.running = true;
        const loop = () => {
            if (this.running) {
                setTimeout(loop, this.animationSettings.frameLength);
                this.redrawSimulation();
            }
        };   
        loop();
    }
    public advanceOneTick() {
        if (this.running) {
            return;
        }
        this.simulation.advanceTick();
        this.redrawSimulation();
    }
    public redrawSimulation() {
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
    }
//#endregion

//#region interaction
    public addBody(body: Body2d, position: Vector2D, velocity: Vector2D = new Vector2D(0, 0)) {
        this.simulation.addObject(body, position, velocity);
        this.redrawSimulation();
    }
    public setG(g: number) {
        this.simulation.g = g;
    }
    public displayVectors(display: boolean) {
        this.animationSettings.displayVectors = display;
        if (!this.running) {
            this.redrawSimulation();
        }
    }
    public resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
        this.redrawSimulation();
    }
    public canvasZoomOut(zoomCenter: Vector2D, zoomStep?: number) {
        if (zoomStep === undefined) {
            zoomStep = this.animationSettings.defaultZoomStep;
        }
        const newZoom = this.canvas.zoomOut(zoomCenter, zoomStep);
        this.redrawSimulation();
        
        return newZoom;
    }
    public canvasZoomIn(zoomCenter: Vector2D, zoomStep?: number) {
        if (zoomStep === undefined) {
            zoomStep = this.animationSettings.defaultZoomStep;
        }
        const newZoom = this.canvas.zoomIn(zoomCenter, zoomStep);
        this.redrawSimulation();

        return newZoom;
    }
    public setCanvasZoom(zoom: number, zoomCenter: Vector2D) { 
        // toDo
    }

    public scrollView(displacement: { x: number; y: number }) {
        this.canvas.moveOrigin(displacement);
        this.redrawSimulation();
    }
    public canvasScrollRight(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("horizontal"); // in simulationUnits
        }
        this.canvas.scrollRight(distance);
        this.redrawSimulation();
    }
    public canvasScrollLeft(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("horizontal"); // in simulationUnits
        }
        this.canvas.scrollLeft(distance);
        this.redrawSimulation();
    }
    public canvasScrollUp(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("vertical"); // in simulationUnits
        }
        this.canvas.scrollUp(distance);
        this.redrawSimulation();
    }
    public canvasScrollDown(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("vertical"); // in simulationUnits
        }
        this.canvas.scrollDown(distance);
        this.redrawSimulation();
    } 
//#endregion

//#region transformations and various calculations
    /**
     * Calculates the distance of the screen dimension (h/v) that one scroll step will move (ie. 0.1 will scroll 10% of the width/height in a horizontal/vertical direction)
     * @param orientation "horizontal" | "vertical"
     * @param rate a number *0 < rate < 1* - defaults to animationSettings.defaultScrollRate 
     * @returns the distance in simulationUnits
     */
    private defaultScrollDistance(orientation: "horizontal" | "vertical", rate?: number): number {
        if (rate === undefined) { rate = this.animationSettings.defaultScrollRate; }
        switch (orientation) {
            case "horizontal":
                return this.canvas.visibleCanvas.width * rate * this.zoom;
            case "vertical":
                return this.canvas.visibleCanvas.height * rate * this.zoom;
        }
    }
    public pointFromCanvasSpaceToSimulationSpace(canvasVector: Vector2D): Vector2D {
        // transformation:
        // 1. scale (canvasVector * zoom in simulationUnits/canvasUnit)
        // 2. flip (y axis are in opposite directions)
        // 3. shift (scaledAndFlippedPoint + Origin of C in SimSpace)
        const scaled = canvasVector.scale(this.canvas.currentZoom);
        const flipped = scaled.hadamardProduct(new Vector2D(1, this.canvas.canvasSpace.orientationY));
        const shifted = flipped.add(this.canvas.canvasSpace.origin);
        return shifted;
    }
//#endregion
}