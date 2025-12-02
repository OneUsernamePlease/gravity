import { Canvas } from "./canvas";
import { Body2d, Simulation } from "./gravity";
import * as util from "./essentials";
import { AnimationSettings, ButtonState, MouseButtons, MouseAction, TouchAction, Mouse as Pointer } from "./types";
import { Coordinate, Vector2D } from "./vector2d";
import { App } from "./app";
import { DEFAULT_SCROLL_RATE, DEFAULT_ZOOM_FACTOR } from "../const";


export class GravityAnimationController {
    private _canvas: Canvas;
    private _simulation: Simulation;
    private _animationSettings: AnimationSettings;
    private _running: boolean;
    // ---
    private pointer: Pointer = { main: { state: ButtonState.Up, downCoordinatesInSimSpace: undefined }, 
                     secondary: { state: ButtonState.Up }, 
                     wheel: { state: ButtonState.Up} };
    private touchAction: TouchAction = TouchAction.None;
    private activeTouches = new Map<number, Coordinate>();
    private previousTouchesMid: Vector2D | null = null;
    private previousTouchesDist: number | null = null;
    private lastSingleTouchPos: Coordinate | null = null;
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
    get currentZoom(): number {
        return this.canvas.currentZoom;
    }
//#endregion
//#region initialization
    constructor(private app: App, elementId: string = "theCanvas") {
        this._canvas = new Canvas(document.getElementById(elementId) as HTMLCanvasElement);
        this._simulation = new Simulation;
        this._animationSettings = { frameLength: 25, displayVectors: true, tracePaths: true };
        this._running = false;
        
        this.canvas.visibleCanvas.addEventListener("pointerdown",   (ev) => this.canvasPointerDown(ev as PointerEvent));
        this.canvas.visibleCanvas.addEventListener("pointerup",     (ev) => this.canvasPointerUp(ev as PointerEvent));
        this.canvas.visibleCanvas.addEventListener("pointermove",   (ev) => this.canvasPointerMoving(ev as PointerEvent));
        this.canvas.visibleCanvas.addEventListener("pointercancel", (ev) => this.cancelPointer(ev as PointerEvent));
        this.canvas.visibleCanvas.addEventListener("mousedown",     (ev) => this.canvasMouseDown(ev as MouseEvent));    // pointerEvents only fire when the first button is pressed, and the last button is released
        this.canvas.visibleCanvas.addEventListener("mouseup",       (ev) => this.canvasMouseUp(ev as MouseEvent));      // so we need mouse events to catch all button interactions
        this.canvas.visibleCanvas.addEventListener("wheel",         (ev) => this.canvasScrollMouseWheel(ev as WheelEvent));
        this.canvas.visibleCanvas.addEventListener("contextmenu",   (ev) => { ev.preventDefault() });
        this.canvas.visibleCanvas.addEventListener("touchend",      (ev) => { ev.preventDefault() }, { passive: false });   // prevent touch-triggered MouseUp
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
        if (ev.pointerType === "mouse") {
            // handled in its own eventListener. PointerDown only fires for presses while no other button is down.
            return;
        }
        this.canvas.visibleCanvas.setPointerCapture(ev.pointerId);
        switch (ev.pointerType) {
            case "touch":
                this.canvasTouchStart(ev);
                break;

            case "pen":
                
                break;

            default:
                console.log("unknown pointerType: " + ev.pointerType);
                break;
        }
        
       
    }
    private canvasPointerUp(ev: PointerEvent) {
        if (ev.pointerType === "mouse") {
            // handled in its own eventListener. PointerUp only fires when the last button is released.
            return;
        }
        this.canvas.visibleCanvas.releasePointerCapture(ev.pointerId);
        switch (ev.pointerType) {
            case "touch":
                this.canvasTouchEnd(ev);
                break;
        
            case "pen":
                
                break;
        
            default:
                console.log("unknown pointerType: " + ev.pointerType);
                break;
        }
        
    }
    private canvasPointerMoving(ev: PointerEvent) {
        const currentMovement = new Vector2D(ev.movementX, ev.movementY);
        
        switch (ev.pointerType) {
            case "mouse":
                // check .buttons (bitmask) to detect wheel press
                // buttons bit 2 (value 4) = wheel button
                const wheelButtonPressed = (ev.buttons & 4) !== 0;
                if (wheelButtonPressed) {
                    ev.preventDefault(); // prevent scroll-symbol
                    this.scrollInCanvasUnits(currentMovement);
                }
                break;
        
            case "touch":
                const currentTouchPosition = this.activeTouches.get(ev.pointerId)!;
                if (!currentTouchPosition) return;

                currentTouchPosition.x = ev.clientX;
                currentTouchPosition.y = ev.clientY;

                switch (this.touchAction) {

                    case TouchAction.AddBody:
                        // TODO: draw (half transparent) body and vector while dragging
                        break;

                    case TouchAction.ManipulateView:
                        if (this.activeTouches.size === 1) {
                            // --------------------
                            //      SINGLE TOUCH
                            // --------------------

                            if (this.lastSingleTouchPos) {
                                const dx = currentTouchPosition.x - this.lastSingleTouchPos.x;
                                const dy = currentTouchPosition.y - this.lastSingleTouchPos.y;

                                // RefactorMe(maybe?) use movement.x / y, mostly works but not technically part of PointerEvents
                                this.scrollInCanvasUnits(new Vector2D(dx, dy));
                            }

                            this.lastSingleTouchPos = { x: currentTouchPosition.x, y: currentTouchPosition.y };
                            return;
                        }

                        // --------------------
                        //      MULTI TOUCH IS WHAT'S LEFT
                        // --------------------
                        const touches = [...this.activeTouches.values()];
                        const p1 = touches[0];
                        const p2 = touches[1];

                        const touchesMidpoint = new Vector2D(
                            (p1.x + p2.x) / 2,
                            (p1.y + p2.y) / 2
                        );

                        const touchesDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

                        // no previous gesture -> initialize
                        if (this.previousTouchesMid === null || this.previousTouchesDist === null) {
                            this.previousTouchesMid = touchesMidpoint;
                            this.previousTouchesDist = touchesDistance;
                            return;
                        }

                        const zoomFactor = touchesDistance / this.previousTouchesDist;
                        const zoomCenterCanvas = this.absoluteToCanvasPosition(touchesMidpoint);
                        const scroll = touchesMidpoint.subtract(this.previousTouchesMid);
                        this.zoomToFactor(zoomFactor, zoomCenterCanvas);
                        this.scrollInCanvasUnits(scroll);

                        this.previousTouchesMid = touchesMidpoint;
                        this.previousTouchesDist = touchesDistance;

                        break;
                    }

                break;
        
            case "pen":
                
                break;
        
            default:
                console.log("unknown pointerType");
                break;
        }
    }
    private cancelPointer(ev: PointerEvent) {
        this.activeTouches.delete(ev.pointerId);
    }
    private canvasScrollMouseWheel(ev: WheelEvent) {
        // don't scroll the entire page
        ev.preventDefault();
        
        const cursorPos = new Vector2D(util.getAbsolutePointerPosition(ev));
        const posInCanvasSpace = this.absoluteToCanvasPosition(cursorPos);

        if (ev.deltaY < 0) {
            this.zoomInByFactor(posInCanvasSpace);
        } else if (ev.deltaY > 0) {
            this.zoomOutByFactor(posInCanvasSpace);
        }
    }    
    private canvasTouchStart(ev: PointerEvent) {
        this.activeTouches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

        if (this.activeTouches.size === 1) {
            this.touchAction = TouchAction.AddBody;
            this.lastSingleTouchPos = { x: ev.clientX, y: ev.clientY };
            
            
            const positionVector = new Vector2D(ev.clientX, ev.clientY);
            const positionInSimSpace: Vector2D = this.pointFromCanvasSpaceToSimulationSpace(positionVector);
            this.pointer.main.downCoordinatesInSimSpace = positionInSimSpace;

        } else if (this.activeTouches.size === 2) {
            this.touchAction = TouchAction.ManipulateView;

            // reset pinch-gesture
            this.previousTouchesMid = null;
            this.previousTouchesDist = null;
            
            // stop scrolling
            this.lastSingleTouchPos = null;
        }
    }
    private canvasTouchEnd(ev: PointerEvent) {
        if (!this.activeTouches.has(ev.pointerId)) return;

        this.activeTouches.delete(ev.pointerId);

        switch (this.touchAction) {
            case TouchAction.AddBody:
                const absPos = util.getAbsolutePointerPosition(ev);
                this.addBodyAtPointer(this.absoluteToCanvasPosition(absPos));
                this.touchAction = TouchAction.None;
                break;

            case TouchAction.ManipulateView:
                // reset pinch-gesture
                this.previousTouchesMid = null;
                this.previousTouchesDist = null;

                if (this.activeTouches.size === 1) {
                    // one touch remaining -> use it to scroll
                    const remaining = this.activeTouches.values().next().value!;
                    this.lastSingleTouchPos = { x: remaining.x, y: remaining.y }
                } else if (this.activeTouches.size === 0) {
                    this.touchAction = TouchAction.None;
                    this.lastSingleTouchPos = null;
                    this.previousTouchesMid = null;
                    this.previousTouchesDist = null;
                }
                break;
        }
    }
    private canvasMouseUp(ev: MouseEvent) {
        const absolutePointerPosition = new Vector2D(util.getAbsolutePointerPosition(ev));
        switch (ev.button) {
            case MouseButtons.Main:
                this.pointer.main.state = ButtonState.Up;
                this.canvasMainMouseUp(absolutePointerPosition);
                break;
            case MouseButtons.Wheel:
                this.pointer.wheel.state = ButtonState.Up;
                
                // prevent scroll-symbol
                ev.preventDefault();
                break;
            case MouseButtons.Secondary:
                this.pointer.secondary.state = ButtonState.Up;
                break;
            default:
                break;
        }
                
    }
    private canvasMouseDown(ev: MouseEvent) {
        const absolutePointerPosition: Vector2D = new Vector2D(ev.clientX, ev.clientY);
        switch (ev.button) {
            case MouseButtons.Main:
                this.pointer.main.state = ButtonState.Down;
                this.canvasMainMouseDown(absolutePointerPosition);
                break;
            case MouseButtons.Wheel:
                this.pointer.wheel.state = ButtonState.Down;
                ev.preventDefault(); // prevent scroll-symbol
                break;
            case MouseButtons.Secondary:
                this.pointer.secondary.state = ButtonState.Down;
                break;
            default:
                break;
        }
    }
    private canvasMainMouseDown(absoluteMousePosition: Coordinate) {
        switch (MouseAction[this.app.selectedClickAction as keyof typeof MouseAction]) {
            case MouseAction.None:
                break;
            case MouseAction.AddBody:
                const positionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const positionInSimSpace: Vector2D = this.pointFromCanvasSpaceToSimulationSpace(positionVector);
                this.pointer.main.downCoordinatesInSimSpace = positionInSimSpace;
                break;
            default:
                break;
        }
    }
    private canvasMainMouseUp(absoluteMousePosition: Vector2D) {
        switch (MouseAction[this.app.selectedClickAction as keyof typeof MouseAction]) {
            case MouseAction.None:
                break;
            case MouseAction.AddBody:
                this.addBodyAtPointer(this.absoluteToCanvasPosition(absoluteMousePosition));
                break;
            default:
                break;
        }
        this.redrawIfPaused();
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
        this.redrawIfPaused();
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
                this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings);
                this.app.updateStatusBarSimulationMessages();
            }
        };   
        loop();
    }
    public advanceOneTick() {
        if (this.running) {
            return;
        }
        this.simulation.advanceTick();
        this.redrawIfPaused();
    }
    public redrawIfPaused() {
        if (!this.running) {
            this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings);
        }
    }
//#endregion

//#region interaction 2
    public addBodyAtPointer(pointerPositionOnCanvas: Coordinate | Vector2D) {
        const pointerPositionVector = pointerPositionOnCanvas instanceof Vector2D ? pointerPositionOnCanvas : new Vector2D(pointerPositionOnCanvas.x, pointerPositionOnCanvas.y);
        const bodyBeingAdded: Body2d = this.app.ui.body2dFromInputs();
        const mousePositionInSimSpace: Vector2D = this.pointFromCanvasSpaceToSimulationSpace(pointerPositionVector);
        const vel: Vector2D = this.simulation.calculateVelocityBetweenPoints(this.pointer.main.downCoordinatesInSimSpace!, mousePositionInSimSpace);
        this.addBody(bodyBeingAdded, mousePositionInSimSpace, vel);
        this.app.updateStatusBarBodyCount();
    }
    public addBody(body: Body2d, position: Vector2D, velocity: Vector2D = new Vector2D(0, 0)) {
        this.simulation.addObject(body, position, velocity);        
        this.redrawIfPaused();
    }
    public setG(g: number) {
        this.simulation.g = g;
    }
    public setDisplayVectors(display: boolean) {
        this.animationSettings.displayVectors = display;
        this.redrawIfPaused();
    }
    public resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
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

        this.app.updateStatusBarZoom();

        if (zoomDelta > 0) {
            return this.canvas.zoomIn(zoomCenter, zoomDelta);
        } else if (zoomDelta < 0) {
            return this.canvas.zoomOut(zoomCenter, -zoomDelta);
        } else {
            return oldZoom;
        }

    }
    public zoomInByFactor(
        zoomCenter: Vector2D = new Vector2D(this.width / 2, this.height / 2),
        factor: number = DEFAULT_ZOOM_FACTOR, 
    ): number {
        const zoomStep = this.currentZoom * factor;
        const newZoom = this.canvas.zoomIn(zoomCenter, zoomStep);
        this.redrawIfPaused();
        this.app.updateStatusBarZoom();

        return newZoom;
    }
    public zoomOutByFactor(
        zoomCenter: Vector2D = new Vector2D(this.width / 2, this.height / 2),
        factor: number = DEFAULT_ZOOM_FACTOR, 
    ): number {
        const zoomStep = this.currentZoom * factor;
        const newZoom = this.canvas.zoomOut(zoomCenter, zoomStep);
        this.redrawIfPaused();
        this.app.updateStatusBarZoom();

        return newZoom;
    }
    public setCanvasView(origin: Vector2D, zoom: number) { 
        this.canvas.setOrigin(origin);
        this.canvas.setZoom(zoom);
        this.app.updateStatusBarZoom();
        this.redrawIfPaused();
    }
    private moveCanvas(displacement: { x: number; y: number }) {
        this.canvas.moveOrigin(displacement);
        this.redrawIfPaused();
    }
    public scrollInCanvasUnits(movementOnCanvas: Vector2D){
        const movementInSimulationUnits = movementOnCanvas.scale(this.currentZoom);
        this.moveCanvas({ x: -(movementInSimulationUnits.x), y: movementInSimulationUnits.y });
    }
    public canvasScrollRight(distance?: number) {
        if (distance === undefined) {
            distance = this.scrollDistance("horizontal"); // in simulationUnits
        }
        this.canvas.scrollRight(distance);
        this.redrawIfPaused();
    }
    public canvasScrollLeft(distance?: number) {
        if (distance === undefined) {
            distance = this.scrollDistance("horizontal"); // in simulationUnits
        }
        this.canvas.scrollLeft(distance);
        this.redrawIfPaused();
    }
    public canvasScrollUp(distance?: number) {
        if (distance === undefined) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.canvas.scrollUp(distance);
        this.redrawIfPaused();
    }
    public canvasScrollDown(distance?: number) {
        if (distance === undefined) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.canvas.scrollDown(distance);
        this.redrawIfPaused();
    } 
//#endregion

//#region transformations and various calculations
    private absoluteToCanvasPosition(absolutePosition: Coordinate): Vector2D {
        const canvasRect = this.canvas.visibleCanvas.getBoundingClientRect();
        const x = absolutePosition.x - canvasRect.left;
        const y = absolutePosition.y - canvasRect.top;
        return new Vector2D(x, y);
    }
    /**
     * Calculates the distance of the screen dimension (h/v) that one scroll step will move (ie. 0.1 will scroll 10% of the width/height in a horizontal/vertical direction)
     * @param orientation "horizontal" | "vertical"
     * @param rate a number *0 < rate < 1* - defaults to animationSettings.defaultScrollRate 
     * @returns the distance in simulationUnits
     */
    private scrollDistance(orientation: "horizontal" | "vertical", rate: number = DEFAULT_SCROLL_RATE): number {
        switch (orientation) {
            case "horizontal":
                return this.width * rate * this.currentZoom;
            case "vertical":
                return this.height * rate * this.currentZoom;
        }
    }
    private pointFromCanvasSpaceToSimulationSpace(canvasVector: Vector2D): Vector2D {
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