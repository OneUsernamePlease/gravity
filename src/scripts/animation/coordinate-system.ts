import { COORDINATE_SYSTEM_AXIS_COLOR, COORDINATE_SYSTEM_AXIS_DASH_LENGTH, COORDINATE_SYSTEM_AXIS_THICKNESS, COORDINATE_SYSTEM_GRID_COLOR, COORDINATE_SYSTEM_GRID_THICKNESS, COORDINATE_SYSTEM_TEXT_COLOR } from "../const/const.js";
import { magnitude, roundTowardsZeroToNearestMultiple } from "../util/util.js";
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

        this.drawAxisGridOrDashes();
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
    private drawAxisGridOrDashes(grid: boolean = true, numbers: boolean = true) {
        const dashBatch: [Vector2D, Vector2D][] = [];
        const dashLengthOnScreen = COORDINATE_SYSTEM_AXIS_DASH_LENGTH * this.zoom;
        const xGridLengthOnScreen = this.zoom * this.width;
        const yGridLengthOnScreen = this.zoom * this.height;
        const origin = this.canvasSpace.origin;
        const magnitudeZoom = magnitude(this.zoom, "1-2-5-10");
        const distanceBetween = magnitudeZoom * 100;
        const xAxisIntersectionCount = this.width * this.zoom / distanceBetween;
        const yAxisIntersectionCount = this.height * this.zoom / distanceBetween;

        // y-axis dashes / x-lines grid
        const lowestYDashPosition = roundTowardsZeroToNearestMultiple(origin.y, distanceBetween); // negative y is up
        const yX1 = grid ? origin.x : -dashLengthOnScreen / 2;
        const yX2 = grid ? origin.x + xGridLengthOnScreen : yX1 + dashLengthOnScreen;
        for (let i = 0; i < yAxisIntersectionCount; i++) {
            const yPosition = lowestYDashPosition + distanceBetween * i;
            dashBatch.push([new Vector2D(yX1, yPosition), new Vector2D(yX2, yPosition)]);
            if (numbers && yPosition !== 0) {
                this.drawAxisNumber("y", yPosition);
            }
        }

        // x-axis dashes / y-lines grid
        const lowestXDashPosition = roundTowardsZeroToNearestMultiple(origin.x, distanceBetween); // negative y is up
        const xY1 = grid ? origin.y : -dashLengthOnScreen / 2;
        const xY2 = grid ? origin.y + yGridLengthOnScreen : xY1 + dashLengthOnScreen;
        for (let i = 0; i < xAxisIntersectionCount; i++) {
            const xPosition = lowestXDashPosition + distanceBetween * i;
            dashBatch.push([new Vector2D(xPosition, xY1), new Vector2D(xPosition, xY2)]);
            if (numbers && xPosition !== 0) {
                this.drawAxisNumber("x", xPosition);
            }
        }

        const color = grid ? COORDINATE_SYSTEM_GRID_COLOR : COORDINATE_SYSTEM_AXIS_COLOR;
        const thickness = grid ? COORDINATE_SYSTEM_GRID_THICKNESS : COORDINATE_SYSTEM_AXIS_THICKNESS;
        draw.drawLineBatch(dashBatch, color, thickness, this._context);
    }
    private drawAxisNumber(axis: "x" | "y", axisValue: number) {
        const color = COORDINATE_SYSTEM_TEXT_COLOR;
        const fontSize = `${11*this.zoom}`;
        const formatNumber = (n: number) => {
            if (Math.abs(n) >= 10000) {
                return n.toExponential(2).replace(/\.?0+e/, "e");
            }
            return n.toFixed(2).replace(/\.?0+$/, ""); // drop trailing zeros. that's why is so the weird.
        }
        const text = formatNumber(axisValue);
        
        let pos: Vector2D = new Vector2D();
        const distanceFromAxis = COORDINATE_SYSTEM_AXIS_DASH_LENGTH * this.zoom / 2;
        switch (axis) {
            case "x":
                pos = new Vector2D(axisValue, -distanceFromAxis);
                break;
        
            case "y":
                pos = new Vector2D(distanceFromAxis, axisValue);
                break;
        
            default:
                break;
        }

        this.drawText(pos, text, color, fontSize)
    }

    private drawText(position: {x: number, y: number}, text: string, color: string, fontSize: string) {
        draw.drawText(position, text, color, fontSize, this._context);
    }
}