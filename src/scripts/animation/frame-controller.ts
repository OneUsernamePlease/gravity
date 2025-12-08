import * as util from "../util/util"
import { Vector2D } from "../util/vector2d";
import { VECTOR_THICKNESS } from "../const/const";

export class FrameController {

//#region properties
    private layers: OffscreenCanvas[] = [];
    private layerContexts: OffscreenCanvasRenderingContext2D[] = [];
    private frameCanvas: OffscreenCanvas;
    private frameContext: OffscreenCanvasRenderingContext2D;

    private _width: number;
    private _height: number;
    private background: number | null = null;

//#endregion
//#region get, set
    public get layerCount() {
        return this.layers.length;
    }

    public get width() {
        return this._width;
    }
    private set width(newWidth: number) {
        this._width = newWidth;
    }

    public get height() {
        return this._height;
    }
    private set height(newHeight: number) {
        this._height = newHeight;
    }
//#endregion
    constructor(width: number, height: number, layerCount = 1) {
        this._width = width;
        this._height = height;
        for (let i = 0; i < layerCount; i++) {
            this.addLayer();
        }
        this.frameCanvas = new OffscreenCanvas(width, height);
        this.frameContext = this.frameCanvas.getContext("2d")!;
    }
//#region methods
    public resize(width: number, height: number) {
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].width = width;
            this.layers[i].height = height;

            // Re-get context (transform + state are reset on resize)
            this.layerContexts[i] = this.layers[i].getContext("2d")!;
            
            // !! reapply context settings
            // they get lost and the content gets cleared on resize
        }
    };
    public frame() {
        const ctx = this.frameContext;
        
        //ctx.clearRect(0, 0, this.width, this.height);
        //ctx.drawBackground();
        //ctx.
        return this.frameCanvas;
    }
    public backgroundChanged() {
        this.drawBackground();
    }
    private addLayer() {
        const canvas = new OffscreenCanvas(this.width, this.height);
        const context = canvas.getContext("2d")!;
        this.layers.push(canvas);
        this.layerContexts.push(context);
        return this.layers.length - 1;
    }
    private drawBackground() {
        this.drawLayer(this.background!);
    }
    private drawLayer(layer: number) {
        const context = this.layerContexts[layer];
        if (!context) { throw new Error(`layer ${layer} does not exist`) };


    }

    /**
     * Clears content from canvas-layer at [layer]. If layer is not provided, clears all layers.
     * @param layer *optional* index in the layer-array.
     */
    private clear(layer?: number) {
        if (!layer) {
            this.layerContexts.forEach(layer => {
                layer.clearRect(0, 0, this.width, this.height);
            });
        } else {
        this.layerContexts[layer].clearRect(0, 0, this.width, this.height);
        }
    }
    private fillCanvas(layer: number, color: string = "#000000") {
        this.layerContexts[layer].fillStyle = color;
        this.layerContexts[layer].fillRect(0, 0, this.width, this.height);
    }
    /**
     * @param from in canvas space
     * @param direction in canvas space
     */
    private drawVector(layer: number, from: Vector2D, direction: Vector2D, color: string = "white") {
        // optionally normalize the direction and scale later
        let endPosition: Vector2D = from.add(direction);
        if (!this.isLineVisible(from, endPosition)) {
            return;
        }
        this.layerContexts[layer].beginPath();
        this.layerContexts[layer].lineWidth = VECTOR_THICKNESS;
        this.layerContexts[layer].strokeStyle = color;
        this.layerContexts[layer].moveTo(from.x, from.y);
        this.layerContexts[layer].lineTo(endPosition.x, endPosition.y);
        this.layerContexts[layer].stroke();
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param position on canvas
     * @param radius in canvas units
     * @param color default white
     */
    public drawCircle(layer: number, position: Vector2D, radius: number, color: string = "white") {
        if (!this.isCircleVisible(position, radius)) return;
        this.layerContexts[layer].beginPath();
        this.layerContexts[layer].arc(position.x, position.y, radius, 0, Math.PI * 2);
        this.layerContexts[layer].closePath();
        this.layerContexts[layer].fillStyle = color;
        this.layerContexts[layer].fill();

    }
    private isCircleVisible(position: Vector2D, radius: number): boolean {
        const inBoundsLeft = position.x + radius >= 0;
        const inBoundsRight = position.x - radius <= this.width;
        const inBoundsTop = position.y + radius >= 0;
        const inBoundsBottom = position.y - radius <= this.height;
        return inBoundsLeft && inBoundsRight && inBoundsTop && inBoundsBottom;
    }
    private isLineVisible(startPoint: Vector2D, endPoint: Vector2D): boolean {
        // if the startPoint or endPoint is in the canvas, return true
        if ((util.isInRange(startPoint.x, 0, this.width) && util.isInRange(startPoint.y, 0, this.height)) ||
            (util.isInRange(endPoint.x, 0, this.width) && util.isInRange(endPoint.y, 0, this.height))) 
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