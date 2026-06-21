import { COORDINATE_SYSTEM_AXIS_COLOR, COORDINATE_SYSTEM_AXIS_DASH_LENGTH, COORDINATE_SYSTEM_AXIS_THICKNESS } from "../const/const.js";
import { clamp, magnitude, roundTowardsZeroToNearestMultiple } from "../util/util.js";
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
    get zoom() {
        return this._canvas.canvasSpace.currentZoom;
    }

    constructor(
        private _context: CanvasRenderingContext2D,
        private _canvas: Canvas,
    ) {
    }
    
    draw() {
        this.drawMainAxis()

        this.drawAxisDashes();
    }
    clearContext() {
        this._context.save();
        this._context.resetTransform();
        this._context.clearRect(0, 0, this.width, this.height);
        this._context.restore();
    }
    private drawMainAxis() {
        const zoom = this.canvasSpace.currentZoom;
        const origin  = this.canvasSpace.origin;
        const xAxisLength = this.width * zoom;
        const yAxisLength = this.height * zoom;
        
        const lineBatch: [Vector2D, Vector2D][] = [
            [new Vector2D(0, origin.y), new Vector2D(0, origin.y + yAxisLength)],
            [new Vector2D(origin.x, 0), new Vector2D(origin.x + xAxisLength, 0)]
        ];

        draw.drawLineBatch(lineBatch, COORDINATE_SYSTEM_AXIS_COLOR, COORDINATE_SYSTEM_AXIS_THICKNESS, this._context);
    }
    private drawAxisDashes() {
        const dashBatch: [Vector2D, Vector2D][] = [];
        const dashLengthOnScreen = COORDINATE_SYSTEM_AXIS_DASH_LENGTH * this.zoom;
        const origin = this.canvasSpace.origin;
        const magnitudeZoom = magnitude(this.zoom, "1-2-5-10");
        const distanceBetween = magnitudeZoom * 100;
        const xDashCount = this.width * this.zoom / distanceBetween;
        const yDashCount = this.height * this.zoom / distanceBetween;

        // y-axis
        const lowestYDashPosition = roundTowardsZeroToNearestMultiple(origin.y, distanceBetween); // negative y is up
        const dashYX1 = -dashLengthOnScreen / 2;
        const dashYX2 = dashYX1 + dashLengthOnScreen;
        for (let i = 0; i < yDashCount; i++) {
            const dashY = lowestYDashPosition + distanceBetween * i;
            dashBatch.push([new Vector2D(dashYX1, dashY), new Vector2D(dashYX2, dashY)]);
        }

        // x-axis
        const lowestXDashPosition = roundTowardsZeroToNearestMultiple(origin.x, distanceBetween); // negative y is up
        const dashXY1 = -dashLengthOnScreen / 2;
        const dashXY2 = dashXY1 + dashLengthOnScreen;
        for (let i = 0; i < xDashCount; i++) {
            const dashX = lowestXDashPosition + distanceBetween * i;
            dashBatch.push([new Vector2D(dashX, dashXY1), new Vector2D(dashX, dashXY2)]);
        }

        draw.drawLineBatch(dashBatch, COORDINATE_SYSTEM_AXIS_COLOR, COORDINATE_SYSTEM_AXIS_THICKNESS, this._context);
    }
    private drawNumbers() {
        throw new Error("not implemented");
        
        // context.fillStyle = COORDINATE_SYSTEM_COLOR;
        // context.font = `${11*zoom}px sans-serif`;
        // context.fillText(`(0,0)`, 0, 0)
    }
}