import { Canvas } from "./canvas";
import { Body2d, Simulation } from "./gravity";
import * as util from "./essentials";
import { AnimationSettings, ButtonState, MouseButtons } from "./types";
import * as c from "../const";
import { Vector2D } from "./vector2d";
import { App } from "./app";

export class GravityAnimationController {
    private _canvas: Canvas;
    private _simulation: Simulation;
    private _animationSettings: AnimationSettings;
    private _running: boolean;
//#region get, set
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
    private set animationSettings(animationSettings: AnimationSettings) {
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
//#endregion
    constructor(private app: App) {
        this._canvas = new Canvas(document.getElementById("theCanvas") as HTMLCanvasElement);
        
        this.canvas.visibleCanvas.addEventListener("mousedown", (ev) => this.canvasMouseDown(ev as MouseEvent));
        this.canvas.visibleCanvas.addEventListener("mouseup", (ev) => this.canvasMouseUp(ev as MouseEvent));
        this.canvas.visibleCanvas.addEventListener("mousemove", (ev) => this.canvasMouseMoving(ev as MouseEvent));
        //this.canvas.visibleCanvas.addEventListener("touchstart", () => this.canvasTouchStart);
        //this.canvas.addEventListener("touchend", () => this.canvasTouchEnd);
        //this.canvas.addEventListener("touchmove", () => this.canvasTouchMove);
        this.canvas.visibleCanvas.addEventListener("wheel", (ev) => this.canvasMouseWheel(ev as WheelEvent));
        this.canvas.visibleCanvas.addEventListener("contextmenu", (ev) => {ev.preventDefault()});

        this._simulation = new Simulation;
        this._animationSettings = { defaultScrollRate: 0.1, defaultZoomStep: 1, frameLength: 25, displayVectors: true, tracePaths: true };
        this._running = false;
    }

//#region initialization
    public initialize(width: number, height: number) {
        this.initCanvas(width, height);
        this.initSimulation();
    }
    private initCanvas(width: number, height: number) {
        this.canvas.visibleCanvas.width = width;
        this.canvas.visibleCanvas.height = height;

        // REFACTOR ME: apply settings after initialization
        this.animationSettings.displayVectors = this.app.ui.displayVectorsCheckbox.checked;
        
        // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
        // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
    }
    private initSimulation() {
        this.simulation.collisionDetection = this.app.ui.collisionDetectionCheckbox.checked;
        this.simulation.elasticCollisions = this.app.ui.elasticCollisionsCheckbox.checked;
    }
//#endregion
//#region interaction

    private canvasMouseDown(ev: MouseEvent) {
        const absoluteMousePosition: Vector2D = new Vector2D(util.getAbsoluteMousePosition(ev));
        if (ev.button === MouseButtons.Main) {
            this.app.canvasMainMouseDown(absoluteMousePosition);
        } else if (ev.button === MouseButtons.Wheel) {
            ev.preventDefault(); // prevent scroll-symbol
        } else if (ev.button === MouseButtons.Secondary) {
            // handled at document level
        }
    }

    private canvasMouseMoving(ev: MouseEvent) {
        if (c.mouse.secondary.state === ButtonState.Down) {
            const currentMovement = new Vector2D(ev.movementX, ev.movementY);
            this.app.canvasSecondaryMouseDragging(currentMovement);
            c.mouse.secondary.downCoordinates = { x: ev.clientX, y: ev.clientY };
        }
    }

    private canvasMouseUp(ev: MouseEvent) {
        const absoluteMousePosition: Vector2D = new Vector2D(util.getAbsoluteMousePosition(ev));
        switch (ev.button) {
            case MouseButtons.Main:
                this.app.canvasMainMouseUp(absoluteMousePosition);
                c.mouse.main.state = ButtonState.Up;
                break;
        
            case MouseButtons.Wheel:
                // prevent scroll-symbol
                ev.preventDefault();
                
                c.mouse.wheel.state = ButtonState.Down;
                c.mouse.wheel.downCoordinates = { x: ev.clientX, y: ev.clientY };
                break;
        
            case MouseButtons.Secondary:
                // prevent context menu
                ev.preventDefault();
                
                c.mouse.secondary.state = ButtonState.Up;
                break;
        
            default:
                break;
        }
    }
    private canvasMouseWheel(ev: WheelEvent) {
        // don't resize the entire page
        ev.preventDefault();
        
        const cursorPos = new Vector2D(util.getAbsoluteMousePosition(ev));
        const posInCanvasSpace = this.app.absoluteToCanvasPosition(cursorPos);

        if (ev.deltaY < 0) {
            this.zoomIn(posInCanvasSpace);
        } else if (ev.deltaY > 0) {
            this.zoomOut(posInCanvasSpace);
        }
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
                this.app.updateSimulationStatusMessages();
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
    public setDisplayVectors(display: boolean) {
        this.animationSettings.displayVectors = display;
        if (!this.running) {
            this.redrawSimulation();
        }
    }
    public resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
        this.redrawSimulation();
    }
    public zoomOut(zoomCenter?: Vector2D, zoomStep?: number): number {
        if (zoomCenter === undefined) {
            zoomCenter = new Vector2D(this.canvas.visibleCanvas.width / 2, this.canvas.visibleCanvas.height / 2);
        }
        if (zoomStep === undefined) {
            zoomStep = this.animationSettings.defaultZoomStep;
        }
        const newZoom = this.canvas.zoomOut(zoomCenter, zoomStep);
        this.redrawSimulation();
        
        return newZoom;
    }
    public zoomIn(zoomCenter?: Vector2D, zoomStep?: number): number {
        if (zoomCenter === undefined) {
            zoomCenter = new Vector2D(this.width / 2, this.height / 2);
        }
        if (zoomStep === undefined) {
            zoomStep = this.animationSettings.defaultZoomStep;
        }
        const newZoom = this.canvas.zoomIn(zoomCenter, zoomStep);
        this.redrawSimulation();

        return newZoom;
    }
    public setCanvasView(origin: Vector2D, zoom: number) { 
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