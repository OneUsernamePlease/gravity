import { Canvas } from "./canvas";
import { Body2d, Simulation } from "./gravity";
import * as util from "./essentials";
import { AnimationSettings, ButtonState, MouseButtons, PointerAction } from "./types";
import * as c from "../const";
import { Vector2D } from "./vector2d";
import { App } from "./app";

export class GravityAnimationController {
    private _canvas: Canvas;
    private _simulation: Simulation;
    private _animationSettings: AnimationSettings;
    private _running: boolean;
    // ---
    private activePointers = new Map<number, PointerEvent>();
    private touchAction: PointerAction = PointerAction.None;
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
//#region initialization
    constructor(private app: App, elementId: string = "theCanvas") {
        this._canvas = new Canvas(document.getElementById(elementId) as HTMLCanvasElement);
        this._simulation = new Simulation;
        this._animationSettings = { defaultScrollRate: 0.1, defaultZoomStep: 1, frameLength: 25, displayVectors: true, tracePaths: true };
        this._running = false;
        
        this.canvas.visibleCanvas.addEventListener("pointerdown", (ev) => this.canvasPointerDown(ev as PointerEvent));
        this.canvas.visibleCanvas.addEventListener("pointerup", (ev) => this.canvasPointerUp(ev as PointerEvent));
        this.canvas.visibleCanvas.addEventListener("pointermove", (ev) => this.canvasPointerMoving(ev as PointerEvent));
        this.canvas.visibleCanvas.addEventListener("pointercancel", (ev) => this.cancelPointer(ev as PointerEvent));

        this.canvas.visibleCanvas.addEventListener("wheel", (ev) => this.canvasMouseWheel(ev as WheelEvent));
        this.canvas.visibleCanvas.addEventListener("contextmenu", (ev) => {ev.preventDefault()});
    }

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
    private canvasPointerDown(ev: PointerEvent) {
        const absolutePointerPosition: Vector2D = new Vector2D(util.getAbsolutePointerPosition(ev));
        switch (ev.pointerType) {
            case "mouse":
                switch (ev.button) {
                    case MouseButtons.Main:
                        c.mouse.main.state = ButtonState.Down;
                        this.app.canvasMainMouseDown(absolutePointerPosition);
                        break;
                    case MouseButtons.Wheel:
                        c.mouse.wheel.state = ButtonState.Down;
                        ev.preventDefault(); // prevent scroll-symbol
                        break;
                    case MouseButtons.Secondary:
                        c.mouse.secondary.state = ButtonState.Down;
                        break;
                    default:
                        break;
                }
                break;
        
            case "touch":
                this.activePointers.set(ev.pointerId, ev);


                break;
        
            case "pen":
                
                break;
        
            default:
                console.log("unknown pointerType: " + ev.pointerType);
                break;
        }
        
        
        
        

    }
    private canvasPointerUp(ev: PointerEvent) {
        const absolutePointerPosition: Vector2D = new Vector2D(util.getAbsolutePointerPosition(ev));
        
        switch (ev.pointerType) {
            case "mouse":
                switch (ev.button) {
                    case MouseButtons.Main:
                        c.mouse.main.state = ButtonState.Up;

                        this.app.canvasMainMouseUp(absolutePointerPosition);
                        break;
                
                    case MouseButtons.Wheel:
                        c.mouse.wheel.state = ButtonState.Up;
                        
                        // prevent scroll-symbol
                        ev.preventDefault();
                        break;
                
                    case MouseButtons.Secondary:
                        c.mouse.secondary.state = ButtonState.Up;
                        
                        // prevent context menu
                        ev.preventDefault();
                        break;
                
                    default:
                        break;
                }
                break;
        
            case "touch":
                if (!this.activePointers.has(ev.pointerId)) {
                    return;
                }
                

                this.activePointers.delete(ev.pointerId);
                break;
        
            case "pen":
                
                break;
        
            default:
                console.log("unknown pointerType: " + ev.pointerType);
                break;
        }
        
    }
    private canvasPointerMoving(ev: PointerEvent) {
        
        switch (ev.pointerType) {
            case "mouse":
                if (c.mouse.wheel.state === ButtonState.Down) {
                    const currentMovement = new Vector2D(ev.movementX, ev.movementY);
                    this.app.scrollCanvas(currentMovement);
                }
                break;
        
            case "touch":
                // if 1 activePointer -> add object

                // if 2 activePointers -> cancel adding and start to scroll and/or zoom

                // if >=3 activePointers -> ??? ignore all or 3+

                break;
        
            case "pen":
                
                break;
        
            default:
                console.log("unknown pointerType");
                break;
        }
    }
    private cancelPointer(ev: PointerEvent) {
        this.activePointers.delete(ev.pointerId);
        
        // cancel the current pointers' action
    }

    private canvasMouseWheel(ev: WheelEvent) {
        // don't resize the entire page
        ev.preventDefault();
        
        const cursorPos = new Vector2D(util.getAbsolutePointerPosition(ev));
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

//#region interaction 2
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
        this.app.updateZoomStatusMessage();

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
        this.app.updateZoomStatusMessage();

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