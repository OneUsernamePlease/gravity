import { COORDINATE_SYSTEM_AXIS_COLOR, COORDINATE_SYSTEM_AXIS_THICKNESS } from "../const/const.js";
import { Vector2D } from "../util/vector2d.js";
import { Canvas } from "./canvas.js";
import * as draw from "./draw-utils.js";
export class CoordinateSystem {
    get canvasSpace() {
        return this._canvas.canvasSpace;
    }
    get width() {
        return this._canvas.width;
    }
    get height() {
        return this._canvas.height;
    }
    constructor(
        private _context: CanvasRenderingContext2D,
        private _canvas: Canvas,
    ) {

    }
    
    draw() {
        const origin  = this.canvasSpace.origin;
        const zoom = this.canvasSpace.currentZoom;

        const xAxisLength = this.width * zoom;
        const yAxisLength = this.height * zoom;
        draw.drawLine(new Vector2D(0, origin.y), new Vector2D(0, yAxisLength), COORDINATE_SYSTEM_AXIS_COLOR, COORDINATE_SYSTEM_AXIS_THICKNESS, this._context);
        draw.drawLine(new Vector2D(origin.x, 0), new Vector2D(xAxisLength, 0), COORDINATE_SYSTEM_AXIS_COLOR, COORDINATE_SYSTEM_AXIS_THICKNESS, this._context);

        // context.fillStyle = COORDINATE_SYSTEM_COLOR;
        // context.font = `${11*zoom}px sans-serif`;
        // context.fillText(`(0,0)`, 0, 0)
    }
    clearContext() {
        this._context.save();
        this._context.resetTransform();
        this._context.clearRect(0, 0, this.width, this.height);
        this._context.restore();
    }
}