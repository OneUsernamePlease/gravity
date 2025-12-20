import { Vector2D } from "../util/vector2d";
import { TouchAction, ButtonState, MouseButtons, Pointer, MouseAction, MultiTouchGesture as MultiTouch, ObjectState } from "../types/types";
import * as util from "../util/util";
import { App } from "../app/app";
import * as tfm from "../util/transformations";
import { Body2d } from "../simulation/body2d";

export class InteractionManager {
//#region properties
    private _touchAction: TouchAction = TouchAction.None;
    private _activeTouches = new Map<number, Vector2D>();
    private _previousTouchesMid: Vector2D | null = null;
    private _previousTouchesDist: number | null = null;
    private _lastSingleTouchPos: Vector2D | null = null;
    private pointer: Pointer = {
        main: { state: ButtonState.Up, downCoordinatesInSimSpace: undefined },
        secondary: { state: ButtonState.Up },
        wheel: { state: ButtonState.Up }
    };
//#endregion
//#region get, set
    get touchAction(): TouchAction {
        return this._touchAction;
    }
    set touchAction(action: TouchAction) {
        this._touchAction = action;
    }

    get activeTouches(): Map<number, Vector2D> {
        return this._activeTouches;
    }
    set activeTouches(touches: Map<number, Vector2D>) {
        this._activeTouches = touches;
    }

    get lastSingleTouchPos(): Vector2D | null {
        return this._lastSingleTouchPos;
    }

    set lastSingleTouchPos(pos: Vector2D | null) {
        this._lastSingleTouchPos = pos;
    }
    
    get previousTouchesMid(): Vector2D | null {
        return this._previousTouchesMid;
    }
    set previousTouchesMid(mid: Vector2D | null) {
        this._previousTouchesMid = mid;
    }

    get previousTouchesDist(): number | null {
        return this._previousTouchesDist;
    }
    set previousTouchesDist(dist: number | null) {
        this._previousTouchesDist = dist;
    }

//#endregion
    constructor(private canvas: HTMLCanvasElement, private app: App) {
        canvas.addEventListener("pointerdown",   (ev) => this.canvasPointerDown(ev as PointerEvent));
        canvas.addEventListener("pointerup",     (ev) => this.canvasPointerUp(ev as PointerEvent));
        canvas.addEventListener("pointermove",   (ev) => this.canvasPointerMoving(ev as PointerEvent));
        canvas.addEventListener("pointercancel", (ev) => this.reset());
        canvas.addEventListener("mousedown",     (ev) => this.canvasMouseDown(ev as MouseEvent));    // pointerEvents only fire when the first button is pressed, and the last button is released
        canvas.addEventListener("mouseup",       (ev) => this.canvasMouseUp(ev as MouseEvent));      // so we need mouse events to catch all button interactions
        canvas.addEventListener("wheel",         (ev) => this.canvasScrollMouseWheel(ev as WheelEvent));
        canvas.addEventListener("contextmenu",   (ev) => { ev.preventDefault() });
        canvas.addEventListener("touchend",      (ev) => { ev.preventDefault() }, { passive: false });   // prevent touch-triggered MouseUp
    }
//#region primary interaction
    private canvasPointerDown(ev: PointerEvent) {
        if (ev.pointerType === "mouse") {
            // handled in its own eventListener. PointerDown only fires for presses while no other button is down.
            return;
        }
        this.canvas.setPointerCapture(ev.pointerId);
        switch (ev.pointerType) {
            case "pen":
            case "touch":
                this.canvasTouchStart(ev);
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
        this.canvas.releasePointerCapture(ev.pointerId);
        switch (ev.pointerType) {
            case "pen":
            case "touch":
                this.canvasTouchEnd(ev);
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
                if (this.pointer.wheel.state === ButtonState.Down) {
                    ev.preventDefault(); // prevent scroll-symbol
                    this.app.scrollInCanvasUnits(currentMovement);
                }
                break;

            case "pen":
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

                                this.app.scrollInCanvasUnits(new Vector2D(dx, dy));
                            }

                            this.lastSingleTouchPos = new Vector2D(currentTouchPosition.x, currentTouchPosition.y);

                            return;
                        } else {

                            // --------------------
                            //      MULTI TOUCH IS WHAT'S LEFT
                            // --------------------
                            const gesture = this.multiTouch();
                            if (!gesture) { return; }

                            const touchesMidpoint = gesture.midpoint;
                            const touchesDistance = gesture.distance;

                            // no previous gesture -> initialize
                            if (this.previousTouchesMid === null || this.previousTouchesDist === null) {
                                this.previousTouchesMid = touchesMidpoint;
                                this.previousTouchesDist = touchesDistance;
                                return;
                            }

                            const zoomFactor = this.previousTouchesDist / touchesDistance;
                            const zoomCenterCanvas = tfm.relativePosition(touchesMidpoint, this.canvas);
                            const scroll = touchesMidpoint.subtract(this.previousTouchesMid);
                            this.app.zoomToFactor(zoomFactor, zoomCenterCanvas);
                            this.app.scrollInCanvasUnits(scroll);

                            this.previousTouchesMid = touchesMidpoint;
                            this.previousTouchesDist = touchesDistance;
                        }
                        break;
                    }

                break;
        
            default:
                console.log("unknown pointerType");
                break;
        }
    }
    private deletePointer(ev: PointerEvent) {
        this.activeTouches.delete(ev.pointerId);
    }
    private canvasScrollMouseWheel(ev: WheelEvent) {
        // don't scroll the entire page
        ev.preventDefault();
        
        const cursorPos = new Vector2D(util.getAbsolutePointerPosition(ev));
        const posOnCanvas = tfm.relativePosition(cursorPos, this.canvas);

        if (ev.deltaY < 0) {
            this.app.zoomIn(posOnCanvas);
        } else if (ev.deltaY > 0) {
            this.app.zoomOut(posOnCanvas);
        }
        this.app.updateStatusBarAnimationInfo();
    }
    private canvasTouchStart(ev: PointerEvent) {
        const touch = new Vector2D(ev.clientX, ev.clientY);
        this.activeTouches.set(ev.pointerId, touch);

        if (this.activeTouches.size === 1) {
            this.touchAction = TouchAction.AddBody;
            this.lastSingleTouchPos = touch;
            
            
            const positionVector = new Vector2D(ev.clientX, ev.clientY);
            const positionInSimSpace: Vector2D = tfm.pointFromCanvasToSimulation(positionVector, this.app.canvasSpace);
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
                this.addBodyAtPointer(tfm.relativePosition(absPos, this.canvas));
                this.touchAction = TouchAction.None;
                break;

            case TouchAction.ManipulateView:
                // reset pinch-gesture
                this.previousTouchesMid = null;
                this.previousTouchesDist = null;

                if (this.activeTouches.size === 1) {
                    // one touch remaining -> use it to scroll
                    const remaining = this.activeTouches.values().next().value!;
                    this.lastSingleTouchPos = new Vector2D(remaining.x, remaining.y);
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
    private canvasMainMouseDown(absoluteMousePosition: Vector2D) {
        switch (MouseAction[this.app.selectedClickAction as keyof typeof MouseAction]) {
            case MouseAction.None:
                break;
            case MouseAction.AddBody:
                const positionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const positionInSimSpace: Vector2D = tfm.pointFromCanvasToSimulation(positionVector, this.app.canvasSpace);
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
                this.addBodyAtPointer(tfm.relativePosition(absoluteMousePosition, this.canvas));
                break;
            default:
                break;
        }
    }
//#endregion
//#region manage interactions
    private updateTouchPosition(pointerId: number, x: number, y: number): void {
        const touch = this.activeTouches.get(pointerId);
        if (touch) {
            touch.x = x;
            touch.y = y;
        }
    }
    private multiTouch(): MultiTouch | null {
        if (this.activeTouches.size < 2) return null;

        const touches = this.activeTouches.values();
        const first = new Vector2D (touches.next().value!);
        const second = new Vector2D (touches.next().value!);

        const midpoint = Vector2D.midpoint(first, second);
        const distance = (new Vector2D(first)).distance(second);
        Math.hypot(second.x - first.x, second.y - first.y);

        return { first, second, midpoint, distance };
    }
    public reset(): void {
        this.touchAction = TouchAction.None;
        this.activeTouches.clear();
        this.previousTouchesMid = null;
        this.previousTouchesDist = null;
        this.lastSingleTouchPos = null;
    }
//#endregion
//#region do stuff
    private canvasToSimulation(positionOnCanvas: Vector2D): Vector2D {
        return tfm.pointFromCanvasToSimulation(positionOnCanvas, this.app.canvasSpace);
    }
    /**
     * @returns the distance, from the coordinate, where the button was pressed (in the simulation), to the current position (in the simulation).
     */
    private getPointerDragDistanceInSimulation(pointerPositionOnCanvas: Vector2D, button = this.pointer.main): Vector2D | null {
        if (!button.downCoordinatesInSimSpace) return null;
        const currentPositionInSimulation = this.canvasToSimulation(pointerPositionOnCanvas);
        return currentPositionInSimulation.displacementVector(button.downCoordinatesInSimSpace);
    }
    private addBodyAtPointer(pointerPositionOnCanvas: Vector2D) {
        this.app.addObject(this.objectStateFromUiAndInteraction(pointerPositionOnCanvas));
        this.app.updateStatusBarSimulationInfo();
    }
    private objectStateFromUiAndInteraction(pointerPositionOnCanvas: Vector2D): ObjectState {
        const body: Body2d = this.app.body2dFromUi();
        const position: Vector2D = this.canvasToSimulation(pointerPositionOnCanvas);
        const velocity: Vector2D = this.pointer.main.downCoordinatesInSimSpace ? util.calculateVelocityBetweenPoints(this.pointer.main.downCoordinatesInSimSpace, position) : new Vector2D;
    
        const objectState: ObjectState = {
            body,
            position,
            velocity,
            acceleration: new Vector2D(),
        }
        return objectState;
    }
//#endregion
}