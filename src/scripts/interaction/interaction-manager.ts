import { Vector2D } from "../util/vector2d.js";
import { TouchAction, ButtonState, MouseButtons, Pointer, MouseAction, MultiTouchGesture as MultiTouch, ObjectState } from "../types/types.js";
import * as util from "../util/util.js";
import { App } from "../app/app.js";
import * as tfm from "../util/transformations.js";
import { Body2d } from "../simulation/body2d.js";
import { ContextMenu } from "./contextMenu.js";
import { Canvas } from "../animation/canvas.js";

export class InteractionManager {
//#region properties
    private _touchAction: TouchAction = TouchAction.None;
    private _activeTouches = new Map<number, Vector2D>();
    private _previousTouchesMid: Vector2D | null = null;
    private _previousTouchesDist: number | null = null;
    private _lastSingleTouchPos: Vector2D | null = null;
    private _canvasContext: CanvasRenderingContext2D;
    private _canvasElement: HTMLCanvasElement;
    private pointer: Pointer = {
        main: { state: ButtonState.Up, downCoordinatesInSimSpace: undefined },
        secondary: { state: ButtonState.Up },
        wheel: { state: ButtonState.Up }
    };
    private contextMenu = new ContextMenu();
//#endregion
//#region get, set
    get touchAction(): TouchAction {
        return this._touchAction;
    }
    private set touchAction(action: TouchAction) {
        this._touchAction = action;
    }

//#endregion
    constructor(private _canvas: Canvas, private app: App) {
        const canvasElement = _canvas.interactionCanvas;
        this._canvasElement = canvasElement;
        this._canvasContext = _canvas.interactionContext;
        canvasElement.addEventListener("pointerdown",   (ev) => this.canvasPointerDown(ev as PointerEvent));
        canvasElement.addEventListener("pointerup",     (ev) => this.canvasPointerUp(ev as PointerEvent));
        canvasElement.addEventListener("pointermove",   (ev) => this.canvasPointerMoving(ev as PointerEvent));
        canvasElement.addEventListener("pointercancel", (ev) => this.cancelAndClearTouches());
        canvasElement.addEventListener("mousedown",     (ev) => this.canvasMouseDown(ev as MouseEvent));    // pointerEvents only fire when the first button is pressed, and the last button is released
        canvasElement.addEventListener("mouseup",       (ev) => this.canvasMouseUp(ev as MouseEvent));      // so we need mouse events to catch all button interactions
        canvasElement.addEventListener("wheel",         (ev) => this.canvasScrollMouseWheel(ev as WheelEvent));
        canvasElement.addEventListener("touchend",      (ev) => { ev.preventDefault() }, { passive: false });   // prevent touch-triggered MouseUp
        canvasElement.addEventListener('contextmenu',   (ev) => { ev.preventDefault() });
    }
//#region primary interaction
    private canvasPointerDown(ev: PointerEvent) {
        if (ev.pointerType === "mouse") {
            // handled in its own eventListener. PointerDown only fires for presses while no other button is down.
            return;
        }
        this._canvasElement.setPointerCapture(ev.pointerId);
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
        this._canvasElement.releasePointerCapture(ev.pointerId);
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
                    this._canvas.move(currentMovement);
                }
                break;

            case "pen":
            case "touch":
                this.canvasTouchMoving(ev);

                break;
        
            default:
                console.log("unknown pointerType");
                break;
        }
    }
    private canvasTouchMoving(ev: PointerEvent) {
        const currentTouchPosition = this._activeTouches.get(ev.pointerId)!;
        if (!currentTouchPosition) return;

        currentTouchPosition.x = ev.clientX;
        currentTouchPosition.y = ev.clientY;

        switch (this.touchAction) {

            case TouchAction.AddBody:
                // TODO: draw (half transparent) body and vector while dragging
                break;
            case TouchAction.ManipulateView:
                if (this._activeTouches.size === 1) {
                    // --------------------
                    //      SINGLE TOUCH
                    // --------------------

                    if (this._lastSingleTouchPos) {
                        const dx = currentTouchPosition.x - this._lastSingleTouchPos.x;
                        const dy = currentTouchPosition.y - this._lastSingleTouchPos.y;

                        this._canvas.move(new Vector2D(dx, dy));
                    }

                    this._lastSingleTouchPos = new Vector2D(currentTouchPosition.x, currentTouchPosition.y);

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
                    if (this._previousTouchesMid === null || this._previousTouchesDist === null) {
                        this._previousTouchesMid = touchesMidpoint;
                        this._previousTouchesDist = touchesDistance;
                        return;
                    }

                    const zoomFactor = this._previousTouchesDist / touchesDistance;
                    const zoomCenterCanvas = tfm.relativePosition(touchesMidpoint, this._canvasElement);
                    const scroll = touchesMidpoint.subtract(this._previousTouchesMid);
                    this.app.zoomToFactor(zoomFactor, zoomCenterCanvas);
                    this._canvas.move(scroll);

                    this._previousTouchesMid = touchesMidpoint;
                    this._previousTouchesDist = touchesDistance;
                }    
                break;
        }
    }
    private deletePointer(ev: PointerEvent) {
        this._activeTouches.delete(ev.pointerId);
    }
    private canvasScrollMouseWheel(ev: WheelEvent) {
        // don't scroll the entire page
        ev.preventDefault();
        
        const cursorPos = new Vector2D(util.getAbsolutePointerPosition(ev));
        const posOnCanvas = tfm.relativePosition(cursorPos, this._canvasElement);

        if (ev.deltaY < 0) {
            this.app.zoomIn(posOnCanvas);
        } else if (ev.deltaY > 0) {
            this.app.zoomOut(posOnCanvas);
        }
    }
    private canvasTouchStart(ev: PointerEvent) {
        const touch = new Vector2D(ev.clientX, ev.clientY);
        this._activeTouches.set(ev.pointerId, touch);

        if (this._activeTouches.size === 1) {
            this.touchAction = TouchAction.AddBody;
            this._lastSingleTouchPos = touch;
            
            const positionOnCanvas = tfm.relativePosition(touch, this._canvasElement);
            const positionInSimSpace: Vector2D = tfm.pointFromCanvasToSimulation(positionOnCanvas, this._canvasContext);
            this.pointer.main.downCoordinatesInSimSpace = positionInSimSpace;

        } else if (this._activeTouches.size === 2) {
            this.touchAction = TouchAction.ManipulateView;

            // reset pinch-gesture
            this._previousTouchesMid = null;
            this._previousTouchesDist = null;
            
            // stop scrolling
            this._lastSingleTouchPos = null;
        }
    }
    private canvasTouchEnd(ev: PointerEvent) {
        if (!this._activeTouches.has(ev.pointerId)) return;

        this._activeTouches.delete(ev.pointerId);

        switch (this.touchAction) {
            case TouchAction.AddBody:
                const absPos = new Vector2D(util.getAbsolutePointerPosition(ev));
                this.addBodyAtPointer(tfm.relativePosition(absPos, this._canvasElement));
                this.touchAction = TouchAction.None;
                break;

            case TouchAction.ManipulateView:
                // reset pinch-gesture
                this._previousTouchesMid = null;
                this._previousTouchesDist = null;

                if (this._activeTouches.size === 1) {
                    // one touch remaining -> use it to scroll
                    const remaining = this._activeTouches.values().next().value!;
                    this._lastSingleTouchPos = new Vector2D(remaining.x, remaining.y);
                } else if (this._activeTouches.size === 0) {
                    this.touchAction = TouchAction.None;
                    this._lastSingleTouchPos = null;
                    this._previousTouchesMid = null;
                    this._previousTouchesDist = null;
                }
                break;
        }
    }
    private canvasMouseUp(ev: MouseEvent) {
        const absolutePointerPosition = new Vector2D(util.getAbsolutePointerPosition(ev));
        const positionOnCanvas = tfm.relativePosition(absolutePointerPosition, this._canvasElement)
        switch (ev.button) {
            case MouseButtons.Main:
                if (this.pointer.main.state === ButtonState.Up) { return; }
                this.canvasMainMouseUp(positionOnCanvas);
                this.pointer.main.state = ButtonState.Up;
                break;
            case MouseButtons.Wheel:
                this.pointer.wheel.state = ButtonState.Up;
                
                // prevent scroll-symbol
                ev.preventDefault();
                break;
            case MouseButtons.Secondary:
                // okay I implemented this and i don' t event need it yet
                // this.openContextMenu(new Vector2D(ev.clientX, ev.clientY));

                this.pointer.secondary.state = ButtonState.Up;
                break;
            default:
                break;
        }
    }
    private canvasMouseDown(ev: MouseEvent) {
        if (this.contextMenu.isOpen) {
            this.closeContextMenu();
            return;
        }
        const absolutePointerPosition: Vector2D = new Vector2D(ev.clientX, ev.clientY);
        const positionOnCanvas = tfm.relativePosition(absolutePointerPosition, this._canvasElement)
        switch (ev.button) {
            case MouseButtons.Main:
                this.pointer.main.state = ButtonState.Down;
                this.canvasMainMouseDown(positionOnCanvas);
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
    private canvasMainMouseDown(positionOnCanvas: Vector2D) {
        switch (MouseAction[this.app.selectedClickAction as keyof typeof MouseAction]) {
            case MouseAction.None:
                break;
            case MouseAction.AddBody:
                this.pointer.main.downCoordinatesInSimSpace = tfm.pointFromCanvasToSimulation(positionOnCanvas, this._canvasContext);
                break;
            default:
                break;
        }
    }
    private canvasMainMouseUp(positionOnCanvas: Vector2D) {
        switch (MouseAction[this.app.selectedClickAction as keyof typeof MouseAction]) {
            case MouseAction.None:
                break;
            case MouseAction.AddBody:
                this.addBodyAtPointer(positionOnCanvas);
                break;
            default:
                break;
        }
    }
    private openContextMenu(position: Vector2D) {
        this.contextMenu.open(
            position,
            [
                {
                    label: 'Test1',
                    action: () => { console.log('test1')},
                }
            ]
        )
    }
    private closeContextMenu() {
        this.contextMenu.close();
    }
//#endregion
//#region manage interactions
    private updateTouchPosition(pointerId: number, x: number, y: number): void {
        const touch = this._activeTouches.get(pointerId);
        if (touch) {
            touch.x = x;
            touch.y = y;
        }
    }
    private multiTouch(): MultiTouch | null {
        if (this._activeTouches.size < 2) return null;

        const touches = this._activeTouches.values();
        const first = new Vector2D (touches.next().value!);
        const second = new Vector2D (touches.next().value!);

        const midpoint = Vector2D.midpoint(first, second);
        const distance = (new Vector2D(first)).distance(second);
        Math.hypot(second.x - first.x, second.y - first.y);

        return { first, second, midpoint, distance };
    }
    private cancelAndClearTouches(): void {
        this.touchAction = TouchAction.None;
        this._activeTouches.clear();
        this._previousTouchesMid = null;
        this._previousTouchesDist = null;
        this._lastSingleTouchPos = null;
    }
//#endregion
//#region do stuff
    /**
     * @returns the distance, from the coordinate, where the button was pressed (in the simulation), to the current position (in the simulation).
     */
    private getPointerDragDistanceInSimulation(pointerPositionOnCanvas: Vector2D, button = this.pointer.main): Vector2D | null {
        if (!button.downCoordinatesInSimSpace) return null;
        const currentPositionInSimulation = tfm.pointFromCanvasToSimulation(pointerPositionOnCanvas, this._canvasContext);
        return currentPositionInSimulation.displacementVector(button.downCoordinatesInSimSpace);
    }
    private addBodyAtPointer(pointerPositionOnCanvas: Vector2D) {
        this.app.addObject(this.objectStateFromUiAndInteraction(pointerPositionOnCanvas));
        this.app.updateStatusBarSimulationInfo();
    }
    private objectStateFromUiAndInteraction(pointerPositionOnCanvas: Vector2D): ObjectState {
        const body: Body2d = this.app.body2dFromUi();
        const position: Vector2D = tfm.pointFromCanvasToSimulation(pointerPositionOnCanvas, this._canvasContext);
        const velocity: Vector2D = this.pointer.main.downCoordinatesInSimSpace ? util.calculateVelocityBetweenPoints(this.pointer.main.downCoordinatesInSimSpace, position) : new Vector2D();
    
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