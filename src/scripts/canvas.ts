import { Body2d } from "./gravity";
import { CanvasSpace, ObjectState } from "./types";
import { Vector2D } from "./vector2d";
import * as essentials from "./essentials";
/*
all position here should be in canvas space

*/


export class Canvas {
    // let offscreenCanvas: OffscreenCanvas; // use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
    // let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D;
    private _visibleCanvas: HTMLCanvasElement;
    private _visibleCanvasContext: CanvasRenderingContext2D;
    private _canvasSpace: CanvasSpace;
    private _running: boolean = false;
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
    get running() {
        return this._running;
    }
    set running(running: boolean) {
        this._running = running;
    }
    // additional getters
    get currentZoom(): number {
        return this.canvasSpace.currentZoom;
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
    public drawVector(position: Vector2D, direction: Vector2D, color: string = "white") {
        // optionally normalize the direction and scale later
        let endPosition: Vector2D = position.add(direction);
        if (!this.isLineVisible(position, endPosition)) {
            return;
        }
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
        let visibleRadius = Math.max(body.radius / this.currentZoom, 1); // Minimum Radius of displayed body is 1
        if (!this.isCircleVisible(position, visibleRadius)) {
            return;
        }
        this.visibleCanvasContext.beginPath();
        this.visibleCanvasContext.arc(position.x, position.y, visibleRadius, 0, Math.PI * 2);
        this.visibleCanvasContext.closePath();
        this.visibleCanvasContext.fillStyle = body.color;
        this.visibleCanvasContext.fill();
    }
    public drawBodies(objectStates: ObjectState[]) {
        objectStates.forEach(object => {
            this.drawBody(object.body, this.pointFromSimulationSpaceToCanvasSpace(object.position));
        });
    }
    public redrawSimulationState(objectStates: ObjectState[], displayVectors: boolean) {
        this.visibleCanvasContext.clearRect(0, 0, this.visibleCanvas.width, this.visibleCanvas.height);
        this.drawBodies(objectStates);
        if (displayVectors) {
            this.drawVectors(objectStates);
        }
    }
    private isCircleVisible(position: Vector2D, radius: number): boolean {
        const inBoundsLeft = position.x + radius >= 0;
        const inBoundsRight = position.x - radius <= this.visibleCanvas.width;
        const inBoundsTop = position.y + radius >= 0;
        const inBoundsBottom = position.y - radius <= this.visibleCanvas.height;
        return inBoundsLeft && inBoundsRight && inBoundsTop && inBoundsBottom;
    }
    private isLineVisible(startPoint: Vector2D, endPoint: Vector2D): boolean {
        // if the startPoint or endPoint is in the canvas, return true
        if ((essentials.isInRange(startPoint.x, 0, this.visibleCanvas.width) && essentials.isInRange(startPoint.y, 0, this.visibleCanvas.height)) ||
            (essentials.isInRange(endPoint.x, 0, this.visibleCanvas.width) && essentials.isInRange(endPoint.y, 0, this.visibleCanvas.height))) 
            {
            return true;
        }
        // if both points are outside the canvas, check if the line intersects with any of the canvas edges
        if (Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(0, 0), new Vector2D(this.visibleCanvas.width, 0)], true) ||
            Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(this.visibleCanvas.width, 0), new Vector2D(this.visibleCanvas.width, this.visibleCanvas.height)], true) ||
            Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(this.visibleCanvas.width, this.visibleCanvas.height), new Vector2D(0, this.visibleCanvas.height)], true) ||
            Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(0, this.visibleCanvas.height), new Vector2D(0, 0)], true)) 
            {
            return true;
        }
        return false;
    }
    //#endregion
    
    /**
     * Origin {x:0,y:0} is at the top-left
     */
    private setOrigin(newOrigin: Vector2D) {
        this.canvasSpace.origin = newOrigin;
    }
    public moveOrigin(displacement: { x: number, y: number}) {
        const originPosition = this.canvasSpace.origin;
        const newOrigin = originPosition.add(displacement);
        this.setOrigin(newOrigin);
    }
    public scrollRight(distance: number) {
        this.moveOrigin(new Vector2D(distance, 0));
    }
    public scrollLeft(distance: number) {
        this.moveOrigin(new Vector2D(-distance, 0));
    }
    public scrollUp(distance: number) {
        this.moveOrigin(new Vector2D(0, distance));
    }
    public scrollDown(distance: number) {
        this.moveOrigin(new Vector2D(0, -distance));
    }
    public zoomOut(zoomCenter: Vector2D, zoomStep: number): number {
        const shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        const newZoom = this.currentZoom + zoomStep;

        this.moveOrigin(shiftOrigin);
        this.canvasSpace.currentZoom = newZoom;

        return newZoom;
    }
    public zoomIn(zoomCenter: Vector2D, zoomStep: number): number {
        if (this.currentZoom <= 1) { 
            return this.currentZoom; 
        }

        let newZoom = this.canvasSpace.currentZoom - zoomStep;
        if (newZoom < 1) {
            newZoom = 1;
            zoomStep = this.canvasSpace.currentZoom - 1;
        }
        
        const shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        this.moveOrigin(shiftOrigin);
        this.canvasSpace.currentZoom = newZoom;
        
        return newZoom;
    }
    private pointFromSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
    // transformation:
    // 1. shift (point in SimSpace - Origin of C in SimSpace)
    // 2. flip (y axis point in opposite directions)
    // 3. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const shifted: Vector2D = simVector.subtract(this.canvasSpace.origin);
    const flipped: Vector2D = new Vector2D(shifted.x, shifted.y * -1);
    const scaled: Vector2D = flipped.scale(1 / this.currentZoom);
    return scaled;
    }
    private directionFromSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
        // transformation:
        // 1. flip (y axis are in opposite directions)
        // 2. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
        const flipped: Vector2D = new Vector2D(simVector.x, simVector.y * -1);
        const scaled: Vector2D = flipped.scale(1 / this.currentZoom);
        return scaled;
    }
    /* 

    ELIMINATED - absolute positions are evaluated in main.ts
    relative positions in app.ts


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
        */
}