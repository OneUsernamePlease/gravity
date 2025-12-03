import { Body2d } from "./gravity";
import { AnimationSettings, CanvasSpace, ObjectState } from "./types";
import { Vector2D } from "./vector2d";
import * as essentials from "./essentials";
import { MAX_ZOOM, MIN_ZOOM, VECTOR_THICKNESS, MIN_DISPLAYED_RADIUS } from "../const";
import * as tfm from "./transformations";

// Here I want only methods that draw in canvas space. they know nothing about ObjectStates[] and do no transformations.

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

    public resize(width: number, height: number) {
        this.visibleCanvas.width = width;
        this.visibleCanvas.height = height;
    }   

    //#region drawing stuff
    /**
     * @param position in canvas space
     * @param direction in canvas space
     */
    private drawVector(position: Vector2D, direction: Vector2D, color: string = "white") {
        // optionally normalize the direction and scale later
        let endPosition: Vector2D = position.add(direction);
        if (!this.isLineVisible(position, endPosition)) {
            return;
        }
        this.visibleCanvasContext.beginPath();
        this.visibleCanvasContext.lineWidth = VECTOR_THICKNESS;
        this.visibleCanvasContext.strokeStyle = color;
        this.visibleCanvasContext.moveTo(position.x, position.y);
        this.visibleCanvasContext.lineTo(endPosition.x, endPosition.y);
        this.visibleCanvasContext.stroke();
    }
    public drawVectors(objectStates: ObjectState[]) {
        objectStates.forEach(objectState => {
            const positionOnCanvas = tfm.pointFromSimulationSpaceToCanvasSpace(objectState.position, this.canvasSpace);
            const accelerationOnCanvas = tfm.directionFromSimulationSpaceToCanvasSpace(objectState.acceleration, this.canvasSpace);
            const velocityOnCanvas = tfm.directionFromSimulationSpaceToCanvasSpace(objectState.velocity, this.canvasSpace);
            
            this.drawVector(positionOnCanvas, accelerationOnCanvas, "green");
            this.drawVector(positionOnCanvas, velocityOnCanvas, "red");
        });
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param body 
     * @param position on canvas
     * @param color default white
     */
    private drawBody(body: Body2d, position: Vector2D) {
        let visibleRadius = Math.max(body.radius / this.currentZoom, MIN_DISPLAYED_RADIUS);
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
            this.drawBody(object.body, tfm.pointFromSimulationSpaceToCanvasSpace(object.position, this.canvasSpace));
        });
    }
    public redrawSimulationState(objectStates: ObjectState[], animationSettings: AnimationSettings) {
        this.visibleCanvasContext.clearRect(0, 0, this.visibleCanvas.width, this.visibleCanvas.height);
        this.drawBodies(objectStates);
        if (animationSettings.displayVectors) {
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
    public setOrigin(newOrigin: Vector2D) {
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

        return newZoom;
    }
    /**
     * Zoom is measured in simulationUnits (meter) per canvasUnit (pixel)
     * @param zoomCenter this point stays fixed while zooming
     * @param zoomStep the change of meter per pixel
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
        
        return newZoom;
    }
    public setZoom(newZoom: number) {
        newZoom = essentials.numberInRange(newZoom, MIN_ZOOM, MAX_ZOOM);
        this.canvasSpace.currentZoom = newZoom;
    }

    
}