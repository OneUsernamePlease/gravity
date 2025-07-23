import { Body2d } from "./gravity";
import { CanvasSpace, ObjectState } from "./types";
import { Vector2D } from "./vector2d";

export class Canvas {
    // let offscreenCanvas: OffscreenCanvas; // use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
    // let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D;
    private _visibleCanvas: HTMLCanvasElement;
    private _visibleCanvasContext: CanvasRenderingContext2D;
    private _canvasSpace: CanvasSpace;
    constructor(visibleCanvas: HTMLCanvasElement) {
        this._visibleCanvas = visibleCanvas;
        this._visibleCanvasContext = visibleCanvas.getContext("2d")!;
        this._canvasSpace = {origin: new Vector2D(0, 0), currentZoom: 1, orientationY: -1};
    }
    //#region get, set
    get visibleCanvas() {
        return this._visibleCanvas;
    }
    set visibleCanvas(canvas: HTMLCanvasElement) {
        this._visibleCanvas = canvas;
    }
    get visibleCanvasContext() {
        return this._visibleCanvasContext;
    }
    set visibleCanvasContext(context: CanvasRenderingContext2D) {
        this._visibleCanvasContext = context;
    }
    get canvasSpace() {
        return this._canvasSpace;
    }
    set canvasSpace(canvasSpace: CanvasSpace) {
        this._canvasSpace = canvasSpace;
    }
    //#endregion

    //#region settings
    public resize(width: number, height: number) {
        this.visibleCanvas.width = width;
        this.visibleCanvas.height = height;
    }   

    //#endregion

    //#region drawing stuff
    /**
     * @param position in canvas space
     * @param direction in canvas space
     */
    public drawVector(position: Vector2D, direction: Vector2D, color?: string) {
        // optionally normalize the direction and scale later
        if (color === undefined) { color = "white" }
        let endPosition: Vector2D = position.add(direction);
        this.visibleCanvasContext.beginPath();
        this.visibleCanvasContext.lineWidth = 3;
        this.visibleCanvasContext.strokeStyle = color;
        this.visibleCanvasContext.moveTo(position.x, position.y);
        this.visibleCanvasContext.lineTo(endPosition.x, endPosition.y);
        this.visibleCanvasContext.stroke();
    }
    public drawVectors(objectStates: ObjectState[]) {
        objectStates.forEach(objectState => {
            this.drawVector(this.pointFromSimulationSpaceToCanvasSpace(objectState.position), this.directionFromSimulationSpaceToCanvasSpace(objectState.acceleration), "green");
            this.drawVector(this.pointFromSimulationSpaceToCanvasSpace(objectState.position), this.directionFromSimulationSpaceToCanvasSpace(objectState.velocity), "red");
        });
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param body 
     * @param position 
     * @param color default white
     */
    public drawBody(body: Body2d, position: Vector2D) {
        let visibleRadius = Math.max(body.radius / this.canvasSpace.currentZoom, 1); // Minimum Radius of displayed body is one
        this.visibleCanvasContext.beginPath();
        this.visibleCanvasContext.arc(position.x, position.y, visibleRadius, 0, Math.PI * 2);
        this.visibleCanvasContext.closePath();
        this.visibleCanvasContext.fillStyle = body.color;
        this.visibleCanvasContext.fill();
    }
    public drawBodies(objectStates: ObjectState[]) {
        objectStates.forEach(object => {
            // REFACTOR ME: draw only if body or its vectors are (partially) visible, otherwise return 
            this.drawBody(object.body, this.pointFromSimulationSpaceToCanvasSpace(object.position));
        });
    }
    public redrawSimulationState(objectStates: ObjectState[], displayVectors: boolean) {
        // REFACTOR ME: instead of displayVectors, pass the current animationSettings, then extract the values here
        this.visibleCanvasContext.clearRect(0, 0, this.visibleCanvas.width, this.visibleCanvas.height);
        this.drawBodies(objectStates);
        if (displayVectors) {
            this.drawVectors(objectStates);
        }
    }
    //#endregion
    private pointFromSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
    // transformation:
    // 1. shift (point in SimSpace - Origin of C in SimSpace)
    // 2. flip (y axis point in opposite directions)
    // 3. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const shifted: Vector2D = simVector.subtract(this.canvasSpace.origin);
    const flipped: Vector2D = new Vector2D(shifted.x, shifted.y * -1);
    const scaled: Vector2D = flipped.scale(1 / this.canvasSpace.currentZoom);
    return scaled;
    }
    private directionFromSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
        // transformation:
        // 1. flip (y axis are in opposite directions)
        // 2. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
        const flipped: Vector2D = new Vector2D(simVector.x, simVector.y * -1);
        const scaled: Vector2D = flipped.scale(1 / this.canvasSpace.currentZoom);
        return scaled;
    }
    public pointFromCanvasSpaceToSimulationSpace(canvasVector: Vector2D): Vector2D {
        // transformation:
        // 1. scale (canvasVector * zoom in simulationUnits/canvasUnit)
        // 2. flip (y axis are in opposite directions)
        // 3. shift (scaledAndFlippedPoint + Origin of C in SimSpace)
        let simulationVector: Vector2D;
        simulationVector = canvasVector.scale(this.canvasSpace.currentZoom).hadamardProduct(new Vector2D(1, this.canvasSpace.orientationY)).add(this.canvasSpace.origin);
        return simulationVector;
    }
    /**
     * Origin {x:0,y:0} is at the top-left
     */
    private setOrigin(newOrigin: Vector2D) {
        this.canvasSpace.origin = newOrigin;
    }
    public moveCanvas(displacement: Vector2D) {
        const originPosition = this._canvasSpace.origin;
        const newOrigin = new Vector2D(originPosition.x + displacement.x, originPosition.y + displacement.y);
        this.setOrigin(newOrigin);
    }
    public moveCanvasRight(distance: number) {
        this.setOrigin(new Vector2D(this.canvasSpace.origin.x + distance, this.canvasSpace.origin.y));
    }
    public moveCanvasLeft(distance: number) {
        this.setOrigin(new Vector2D(this.canvasSpace.origin.x - distance, this.canvasSpace.origin.y ));
    }
    public moveCanvasUp(distance: number) {
        this.setOrigin(new Vector2D(this.canvasSpace.origin.x, this.canvasSpace.origin.y + distance));
    }
    public moveCanvasDown(distance: number) {
        this.setOrigin(new Vector2D(this.canvasSpace.origin.x, this.canvasSpace.origin.y - distance));
    }
    public zoomOut(zoomCenter: Vector2D, zoomStep: number) {
        const shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        const newZoom = this.canvasSpace.currentZoom + zoomStep;

        this.canvasSpace.origin = new Vector2D(this.canvasSpace.origin.x - shiftOrigin.x, this.canvasSpace.origin.y + shiftOrigin.y);
        this.canvasSpace.currentZoom = newZoom;
    }
    public zoomIn(zoomCenter: Vector2D, zoomStep: number) {
        if (this.canvasSpace.currentZoom <= 1) { 
            return; 
        }

        let newZoom = this.canvasSpace.currentZoom - zoomStep;
        if (newZoom < 1) {
            newZoom = 1;
            zoomStep = this.canvasSpace.currentZoom - 1;
        }
        
        let shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        this.canvasSpace.origin = new Vector2D(this.canvasSpace.origin.x + shiftOrigin.x, this.canvasSpace.origin.y - shiftOrigin.y);
        this.canvasSpace.currentZoom = newZoom;
    }
    public getCanvasMousePosition(event: MouseEvent): Vector2D {
        const rect = this.visibleCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return new Vector2D(x, y);
    }
    public getCanvasTouchPosition(event: TouchEvent): Vector2D {
        const rect = this.visibleCanvas.getBoundingClientRect();
        const touch = event.touches[0];
        return new Vector2D(touch.clientX - rect.left, touch.clientY - rect.top)
    }
    public getCanvasTouchEndPosition(event: TouchEvent): Vector2D {
        const rect = this.visibleCanvas.getBoundingClientRect();
        const touch = event.changedTouches[0];
        return new Vector2D(touch.clientX - rect.left, touch.clientY - rect.top)
    }
}