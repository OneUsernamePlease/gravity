import { Vector2D } from "../util/vector2d.js";
import * as essentials from "../util/util.js";
import { VECTOR_THICKNESS } from "../const/const.js";

export class Canvas {
//#region properties
    // let offscreenCanvas: OffscreenCanvas; // use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
    // let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D;
    private _visibleCanvas: HTMLCanvasElement;
    private _visibleCanvasContext: CanvasRenderingContext2D;
    constructor(private _canvasParent: HTMLDivElement) {
        this._visibleCanvas = this.createLayer("z-0");
        this._visibleCanvasContext = this._visibleCanvas.getContext("2d", { alpha: false })!;
    }
//#endregion
//#region get, set
    get visibleCanvas() {
        return this._visibleCanvas;
    }
    private get visibleCanvasContext() {
        return this._visibleCanvasContext;
    }
    // additional getters
    get width(): number {
        return this.visibleCanvas.width;
    }
    get height(): number {
        return this.visibleCanvas.height;
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
        this.visibleCanvas.width = width;
        this.visibleCanvas.height = height;
    }   
//#region drawing stuff
    clear() {
        this.visibleCanvasContext.clearRect(0, 0, this.width, this.height);
    }
    fillCanvas(color: string = "#000000") {
        this.visibleCanvasContext.fillStyle = color;
        this.visibleCanvasContext.fillRect(0, 0, this.width, this.height);
    }
    /**
     * @param position in canvas space
     * @param direction in canvas space
     */
    drawVector(position: Vector2D, direction: Vector2D, color: string = "white") {
        // optionally normalize the direction and scale later
        let endPosition: Vector2D = position.add(direction);
        if (!this.isLinePotentiallyVisible(position, endPosition)) {
            return;
        }
        this.visibleCanvasContext.beginPath();
        this.visibleCanvasContext.lineWidth = VECTOR_THICKNESS;
        this.visibleCanvasContext.strokeStyle = color;
        this.visibleCanvasContext.moveTo(position.x, position.y);
        this.visibleCanvasContext.lineTo(endPosition.x, endPosition.y);
        this.visibleCanvasContext.stroke();
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param position on canvas
     * @param radius in canvas units
     * @param color default white
     */
    drawCircle(position: Vector2D, radius: number, color: string = "white") {
        if (!this.isCircleVisible(position, radius)) return;
        this.visibleCanvasContext.beginPath();
        this.visibleCanvasContext.arc(position.x, position.y, radius, 0, Math.PI * 2);
        this.visibleCanvasContext.closePath();
        this.visibleCanvasContext.fillStyle = color;
        this.visibleCanvasContext.fill();

    }
    private isCircleVisible(position: Vector2D, radius: number): boolean {
        const inBoundsLeft = position.x + radius >= 0;
        const inBoundsRight = position.x - radius <= this.visibleCanvas.width;
        const inBoundsTop = position.y + radius >= 0;
        const inBoundsBottom = position.y - radius <= this.visibleCanvas.height;
        return inBoundsLeft && inBoundsRight && inBoundsTop && inBoundsBottom;
    }
    private isLinePotentiallyVisible(startPoint: Vector2D, endPoint: Vector2D) :boolean {
        const w = this.visibleCanvas.width;
        const h = this.visibleCanvas.height;

        const minX = startPoint.x < endPoint.x ? startPoint.x : endPoint.x;
        const maxX = startPoint.x > endPoint.x ? startPoint.x : endPoint.x;
        const minY = startPoint.y < endPoint.y ? startPoint.y : endPoint.y;
        const maxY = startPoint.y > endPoint.y ? startPoint.y : endPoint.y;

        return !(maxX < 0 || minX > w || maxY < 0 || minY > h);
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
}