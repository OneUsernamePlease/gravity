import { Body2d, Simulation } from "./gravity";
import { AnimationSettings, CanvasSpace, ObjectState } from "./types";
import { Vector2D } from "./vector2d";

export class Canvas {
    // let offscreenCanvas: OffscreenCanvas; // use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
    // let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D;
    private _visibleCanvas: HTMLCanvasElement;
    private _visibleCanvasContext: CanvasRenderingContext2D;
    private _canvasSpace: CanvasSpace;
    private _animationSettings: AnimationSettings;
    private _animationRunning: boolean;
    constructor(visibleCanvas: HTMLCanvasElement) {
        this._visibleCanvas = visibleCanvas;
        this._visibleCanvasContext = visibleCanvas.getContext("2d")!;
        this._canvasSpace = {origin: new Vector2D(0, 0), zoomFactor: 1, orientationY: -1};
        this._animationSettings = { defaultScrollRate: 0.1, defaultZoomStep: 1, frameLength: 25, displayVectors: true, tracePaths: false };
        this._animationRunning = false;
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
    get animationSettings() {
        return this._animationSettings;
    }
    set animationSettings(animationSetting: AnimationSettings) {
        this._animationSettings = animationSetting;
    }
    get animationRunning() {
        return this._animationRunning;
    }
    set animationRunning(animationRunning: boolean) {
        this._animationRunning = animationRunning;
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
            this.drawVector(this.pointInSimulationSpaceToCanvasSpace(objectState.position), this.directionInSimulationSpaceToCanvasSpace(objectState.acceleration), "green");
            this.drawVector(this.pointInSimulationSpaceToCanvasSpace(objectState.position), this.directionInSimulationSpaceToCanvasSpace(objectState.velocity), "red");
        });
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param body 
     * @param position 
     * @param color default white
     */
    public drawBody(body: Body2d, position: Vector2D) {
        let visibleRadius = Math.max(body.radius / this.canvasSpace.zoomFactor, 1); // Minimum Radius of displayed body is one
        this.visibleCanvasContext.beginPath();
        this.visibleCanvasContext.arc(position.x, position.y, visibleRadius, 0, Math.PI * 2);
        this.visibleCanvasContext.closePath();
        this.visibleCanvasContext.fillStyle = body.color;
        this.visibleCanvasContext.fill();
    }
    public drawBodies(objectStates: ObjectState[]) {
        objectStates.forEach(object => {
            this.drawBody(object.body, this.pointInSimulationSpaceToCanvasSpace(object.position));
        });
    }
    public redrawSimulationState(objectStates: ObjectState[], displayVectors: boolean) {
        this.visibleCanvasContext.clearRect(0, 0, this.visibleCanvas.width, this.visibleCanvas.height);
        this.drawBodies(objectStates);
        if (displayVectors) {
            this.drawVectors(objectStates);
        }
    }
    //#endregion

    public pointInSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
    // transformation:
    // 1. shift (point in SimSpace - Origin of C in SimSpace)
    // 2. flip (y axis point in opposite directions)
    // 3. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const shifted: Vector2D = simVector.subtract(this.canvasSpace.origin);
    const flipped: Vector2D = new Vector2D(shifted.x, shifted.y * -1);
    const scaled: Vector2D = flipped.scale(1 / this.canvasSpace.zoomFactor);
    return scaled;
    }
    public directionInSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
        // transformation:
        // 1. flip (y axis are in opposite directions)
        // 2. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
        const flipped: Vector2D = new Vector2D(simVector.x, simVector.y * -1);
        const scaled: Vector2D = flipped.scale(1 / this.canvasSpace.zoomFactor);
        return scaled;
    }
    public pointInCanvasSpaceToSimulationSpace(canvasVector: Vector2D): Vector2D {
        // transformation:
        // 1. scale (canvasVector * zoom in simulationUnits/canvasUnit)
        // 2. flip (y axis are in opposite directions)
        // 3. shift (scaledAndFlippedPoint + Origin of C in SimSpace)
        let simulationVector: Vector2D;
        simulationVector = canvasVector.scale(this.canvasSpace.zoomFactor).hadamardProduct(new Vector2D(1, this.canvasSpace.orientationY)).add(this.canvasSpace.origin);
        return simulationVector;
    }    
    /**
     * Origin {x:0,y:0} is at the top-left
     */
    public setCanvasOrigin(newOrigin: Vector2D) {
        this.canvasSpace.origin = newOrigin;
    }
    public moveCanvasRight(rate?: number) {
        const distance = this.calculateScrollDistance("horizontal", rate); // in simulationUnits
        this.setCanvasOrigin(new Vector2D(this.canvasSpace.origin.x + distance, this.canvasSpace.origin.y));
    }
    public moveCanvasLeft(rate?: number) {
        const distance = this.calculateScrollDistance("horizontal", rate); // in simulationUnits
        this.setCanvasOrigin(new Vector2D(this.canvasSpace.origin.x - distance, this.canvasSpace.origin.y ));
    }
    public moveCanvasUp(rate?: number) {
        const distance = this.calculateScrollDistance("vertical", rate); // in simulationUnits
        this.setCanvasOrigin(new Vector2D(this.canvasSpace.origin.x, this.canvasSpace.origin.y + distance));
    }
    public moveCanvasDown(rate?: number) {
        const distance = this.calculateScrollDistance("vertical", rate); // in simulationUnits
        this.setCanvasOrigin(new Vector2D(this.canvasSpace.origin.x, this.canvasSpace.origin.y - distance));
    }
    /**
     * 
     * @param orientation "horizontal" | "vertical"
     * @param rate a number *0<rate<1* - the relative distance of the screen dimension (h/v) that one scroll step will move (ie. 0.1 will scroll 10% of the width/height in a horizontal/vertical direction)
     * @returns 
     */
    private calculateScrollDistance(orientation: "horizontal" | "vertical", rate?: number): number {
        if (rate === undefined) { rate = this.animationSettings.defaultScrollRate; }
        switch (orientation) {
            case "horizontal":
                return this.visibleCanvas.width * rate * this.canvasSpace.zoomFactor;
            case "vertical":
                return this.visibleCanvas.height * rate * this.canvasSpace.zoomFactor;
        }
    }
    public zoomOut(zoomCenter: Vector2D) {
        const newZoom = this.canvasSpace.zoomFactor + this.animationSettings.defaultZoomStep;

        let shiftOrigin: Vector2D = zoomCenter.scale(this.animationSettings.defaultZoomStep); // zoom step here is really the difference in zoom change (zoomFactor now - zoomFactor before)

        this.canvasSpace.origin = new Vector2D(this.canvasSpace.origin.x - shiftOrigin.x, this.canvasSpace.origin.y + shiftOrigin.y);
        this.canvasSpace.zoomFactor = newZoom;
    }
    public zoomIn(zoomCenter: Vector2D) {
        if (this.canvasSpace.zoomFactor <= 1) { return; }
        let newZoom = this.canvasSpace.zoomFactor - this.animationSettings.defaultZoomStep;

        let shiftOrigin: Vector2D = zoomCenter.scale(this.animationSettings.defaultZoomStep); // zoom step here is really the difference in zoom change (zoomFactor now - zoomFactor before)

        this.canvasSpace.origin = new Vector2D(this.canvasSpace.origin.x + shiftOrigin.x, this.canvasSpace.origin.y - shiftOrigin.y);
        this.canvasSpace.zoomFactor = newZoom;
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