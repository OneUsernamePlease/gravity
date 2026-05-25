import { Vector2D } from "../util/vector2d.js";
import * as essentials from "../util/util.js";
import { BACKGROUND_COLOR, VECTOR_THICKNESS } from "../const/const.js";

export class Canvas {
//#region properties
    
    private _backgroundCanvas: HTMLCanvasElement;
    private _backgroundContext: CanvasRenderingContext2D;

    private _simulationCanvas: HTMLCanvasElement;
    private _simulationContext: CanvasRenderingContext2D;

    private _interactionCanvas: HTMLCanvasElement;
    private _interactionContext: CanvasRenderingContext2D;
    constructor(private _canvasParent: HTMLDivElement) {
        this._backgroundCanvas = this.createLayer("z-0");
        this._backgroundContext = this._backgroundCanvas.getContext("2d", { alpha: false })!;

        this._simulationCanvas = this.createLayer("z-10");
        this._simulationContext = this._simulationCanvas.getContext("2d")!;
        
        this._interactionCanvas = this.createLayer("z-20");
        this._interactionContext = this._interactionCanvas.getContext("2d")!;
    }
//#endregion
//#region get, set
    get backgroundCanvas() {
        return this._backgroundCanvas;
    }
    get simulationCanvas() {
        return this._simulationCanvas;
    }
    get interactionCanvas() {
        return this._interactionCanvas;
    }
    get backgroundContext() {
        return this._backgroundContext;
    }
    get simulationContext() {
        return this._simulationContext;
    }
    get interactionContext() {
        return this._interactionContext;
    }
    // additional getters
    get width(): number {
        return this._backgroundCanvas.width;
    }
    get height(): number {
        return this._backgroundCanvas.height;
    }
//#endregion
    createLayer(zIndexClass: string): HTMLCanvasElement {
        if (!(/^z-0$|^z-[1-9]\d*$/.test(zIndexClass))) {
            throw new Error("zIndex has to be a valid tailwind z-value (eg. 'z-0' or 'z-123'");
        }

        const canvas = document.createElement("canvas");
        canvas.className = `absolute inset-0 w-full h-full touch-none ${zIndexClass}`;
        this._canvasParent.appendChild(canvas);

        return canvas;
    }
    resize(width: number, height: number) {
        const canvases = [
            this._backgroundCanvas,
            this._simulationCanvas,
            this._interactionCanvas,
        ];

        for (const canvas of canvases) {
            canvas.width = width;
            canvas.height = height;
        }

        this.fillBackground();
    }   
//#region drawing stuff
    private clear(context: CanvasRenderingContext2D) {
        context.clearRect(0, 0, this.width, this.height);
    }
    clearAll() {
        this.clear(this._backgroundContext);
        this.clear(this._simulationContext);
        this.clear(this._interactionContext);
    }
    clearSimulation() {
        this.clear(this._simulationContext);
    }
    fillBackground(
        color: string = BACKGROUND_COLOR
    ) {
        this.backgroundContext.fillStyle = color;
        this.backgroundContext.fillRect(0, 0, this.width, this.height);
    }
    /**
     * @param position in canvas space
     * @param direction in canvas space
     */
    drawVector(position: Vector2D, direction: Vector2D, color = "white", context = this.simulationContext) {
        // optionally normalize the direction and scale later
        let endPosition: Vector2D = position.add(direction);
        if (!this.isLinePotentiallyVisible(position, endPosition)) {
            return;
        }
        context.beginPath();
        context.lineWidth = VECTOR_THICKNESS;
        context.strokeStyle = color;
        context.moveTo(position.x, position.y);
        context.lineTo(endPosition.x, endPosition.y);
        context.stroke();
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param position on canvas
     * @param radius in canvas units
     * @param color default white
     */
    drawCircle(position: Vector2D, radius: number, color: string = "white", context = this.simulationContext) {
        if (!this.isCircleVisible(position, radius)) return;
        context.beginPath();
        context.arc(position.x, position.y, radius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = color;
        context.fill();

    }
    private isCircleVisible(position: Vector2D, radius: number): boolean {
        const inBoundsLeft = position.x + radius >= 0;
        const inBoundsRight = position.x - radius <= this.width;
        const inBoundsTop = position.y + radius >= 0;
        const inBoundsBottom = position.y - radius <= this.height;
        return inBoundsLeft && inBoundsRight && inBoundsTop && inBoundsBottom;
    }
    private isLinePotentiallyVisible(startPoint: Vector2D, endPoint: Vector2D) :boolean {
        const minX = startPoint.x < endPoint.x ? startPoint.x : endPoint.x;
        const maxX = startPoint.x > endPoint.x ? startPoint.x : endPoint.x;
        const minY = startPoint.y < endPoint.y ? startPoint.y : endPoint.y;
        const maxY = startPoint.y > endPoint.y ? startPoint.y : endPoint.y;

        return !(maxX < 0 || minX > this.width || maxY < 0 || minY > this.height);
    }
    private isLineVisible(startPoint: Vector2D, endPoint: Vector2D): boolean {
        // if the startPoint or endPoint is in the canvas, return true
        if ((essentials.isInRange(startPoint.x, 0, this.width) && essentials.isInRange(startPoint.y, 0, this.height)) ||
            (essentials.isInRange(endPoint.x, 0, this.width) && essentials.isInRange(endPoint.y, 0, this.height))) 
            {
            return true;
        }
        // if both points are outside the canvas, check if the line intersects with any of the canvas edges
        if (Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(0, 0), new Vector2D(this.width, 0)], true) ||
            Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(this.width, 0), new Vector2D(this.width, this.height)], true) ||
            Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(this.width, this.height), new Vector2D(0, this.height)], true) ||
            Vector2D.linesIntersecting([startPoint, endPoint], [new Vector2D(0, this.height), new Vector2D(0, 0)], true)) 
            {
            return true;
        }
        return false;
    }
//#endregion
}