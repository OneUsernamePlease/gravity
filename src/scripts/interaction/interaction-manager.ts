import { Vector2D } from "../util/vector2d";
import { TouchAction, ButtonState, MouseButtons, Pointer, MouseAction, MultiTouchGesture } from "../const/types";
import * as util from "../util/util";
import { Canvas } from "../animation/canvas";
import { App } from "../app/app";
import * as tfm from "../util/transformations";
import { Body2d } from "../simulation/gravity";

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
    // additional getters
    get gravityAnimationController() {
        return this.app.gravityAnimationController;
    }
    get ui() {
        return this.app.ui;
    }
//#endregion
    constructor(private canvas: Canvas, private app: App) {
        const visibleCanvas = canvas.visibleCanvas;
        visibleCanvas.addEventListener("pointerdown",   (ev) => this.canvasPointerDown(ev as PointerEvent));
        visibleCanvas.addEventListener("pointerup",     (ev) => this.canvasPointerUp(ev as PointerEvent));
        visibleCanvas.addEventListener("pointermove",   (ev) => this.canvasPointerMoving(ev as PointerEvent));
        visibleCanvas.addEventListener("pointercancel", (ev) => this.deletePointer(ev as PointerEvent));
        visibleCanvas.addEventListener("mousedown",     (ev) => this.canvasMouseDown(ev as MouseEvent));    // pointerEvents only fire when the first button is pressed, and the last button is released
        visibleCanvas.addEventListener("mouseup",       (ev) => this.canvasMouseUp(ev as MouseEvent));      // so we need mouse events to catch all button interactions
        visibleCanvas.addEventListener("wheel",         (ev) => this.canvasScrollMouseWheel(ev as WheelEvent));
        visibleCanvas.addEventListener("contextmenu",   (ev) => { ev.preventDefault() });
        visibleCanvas.addEventListener("touchend",      (ev) => { ev.preventDefault() }, { passive: false });   // prevent touch-triggered MouseUp
    }
//#region primary interaction
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
                if (this.pointer.wheel.state === ButtonState.Down) {
                    ev.preventDefault(); // prevent scroll-symbol
                    this.gravityAnimationController.scrollInCanvasUnits(currentMovement);
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
                                this.gravityAnimationController.scrollInCanvasUnits(new Vector2D(dx, dy));
                            }

                            this.lastSingleTouchPos = new Vector2D(currentTouchPosition.x, currentTouchPosition.y);
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
                        const zoomCenterCanvas = tfm.relativePosition(touchesMidpoint, this.canvas.visibleCanvas);
                        const scroll = touchesMidpoint.subtract(this.previousTouchesMid);
                        this.gravityAnimationController.zoomToFactor(zoomFactor, zoomCenterCanvas);
                        this.gravityAnimationController.scrollInCanvasUnits(scroll);

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
    private deletePointer(ev: PointerEvent) {
        this.activeTouches.delete(ev.pointerId);
    }
    private canvasScrollMouseWheel(ev: WheelEvent) {
        // don't scroll the entire page
        ev.preventDefault();
        
        const cursorPos = new Vector2D(util.getAbsolutePointerPosition(ev));
        const posInCanvasSpace = tfm.absoluteToCanvasPosition(cursorPos, this.canvas.visibleCanvas);

        if (ev.deltaY < 0) {
            this.gravityAnimationController.zoomIn(posInCanvasSpace);
        } else if (ev.deltaY > 0) {
            this.gravityAnimationController.zoomOut(posInCanvasSpace);
        }
        this.ui.updateStatusBarAnimationInfo();
    }    
    private canvasTouchStart(ev: PointerEvent) {
        const touch = new Vector2D(ev.clientX, ev.clientY);
        this.activeTouches.set(ev.pointerId, touch);

        if (this.activeTouches.size === 1) {
            this.touchAction = TouchAction.AddBody;
            this.lastSingleTouchPos = touch;
            
            
            const positionVector = new Vector2D(ev.clientX, ev.clientY);
            const positionInSimSpace: Vector2D = tfm.pointFromCanvasSpaceToSimulationSpace(positionVector, this.gravityAnimationController.canvasSpace);
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
                this.addBodyAtPointer(tfm.absoluteToCanvasPosition(absPos, this.canvas.visibleCanvas));
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
        switch (MouseAction[this.ui.selectedClickAction as keyof typeof MouseAction]) {
            case MouseAction.None:
                break;
            case MouseAction.AddBody:
                const positionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const positionInSimSpace: Vector2D = tfm.pointFromCanvasSpaceToSimulationSpace(positionVector, this.gravityAnimationController.canvasSpace);
                this.pointer.main.downCoordinatesInSimSpace = positionInSimSpace;
                break;
            default:
                break;
        }
    }
    private canvasMainMouseUp(absoluteMousePosition: Vector2D) {
        switch (MouseAction[this.ui.selectedClickAction as keyof typeof MouseAction]) {
            case MouseAction.None:
                break;
            case MouseAction.AddBody:
                this.addBodyAtPointer(tfm.absoluteToCanvasPosition(absoluteMousePosition, this.canvas.visibleCanvas));
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
    private multiTouchGesture(): MultiTouchGesture | null {
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
    private addBodyAtPointer(pointerPositionOnCanvas: Vector2D) {
        const bodyBeingAdded: Body2d = this.ui.body2dFromInputs();
        const mousePositionInSimSpace: Vector2D = tfm.pointFromCanvasSpaceToSimulationSpace(pointerPositionOnCanvas, this.gravityAnimationController.canvasSpace);
        const vel: Vector2D = util.calculateVelocityBetweenPoints(this.pointer.main.downCoordinatesInSimSpace!, mousePositionInSimSpace);
        this.gravityAnimationController.addBody(bodyBeingAdded, mousePositionInSimSpace, vel);
        this.ui.updateStatusBarSimulationInfo();
    }

//#endregion
}