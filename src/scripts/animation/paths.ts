import { PATH_LENGTH, PATH_THICKNESS } from "../const/const.js";
import { ObjectState } from "../types/types.js";
import { RingBuffer } from "../util/ring-buffer.js";
import { Vector2D } from "../util/vector2d.js";
import { AnimationController } from "./animation-controller.js";
import { Canvas } from "./canvas.js";
interface PathSegment {
    coordinate: Vector2D,
    color: string,
}
export class Path extends Path2D {
    private _lengthInSegments = 0;
    private _lastPosition: Vector2D | null = null;
    constructor(
    ) { 
        super();
    }
    get lengthInSegments() {
        return this._lengthInSegments;
    }
    get lastPosition() {
        return this._lastPosition;
    }
    addSegment(position: Vector2D, color: string) {
        const positionX = position.x;
        const positionY = position.y;
        if (this._lengthInSegments === 0) {
            this.moveTo(positionX, positionY);
            this._lastPosition = new Vector2D(positionX, positionY);
        } else {
            this.lineTo(positionX, positionY);
            this._lastPosition!.x = positionX;
            this._lastPosition!.y = positionY;
        }

        this._lengthInSegments++;
    }
}
export class Paths extends Map<number, Path> {
    private _offscreenCanvas: OffscreenCanvas;
    private _offscreenContext: OffscreenCanvasRenderingContext2D;
    get zoom() {
        return this._canvas.currentZoom;
    }
    get offscreenCanvas() {
        return this._offscreenCanvas;
    }
    constructor(
        private _canvas: Canvas,
        width: number,
        height: number
    ) {
        super();
        this._offscreenCanvas = new OffscreenCanvas(width, height);
        const offscreenContext = this._offscreenCanvas.getContext("2d");
        if (offscreenContext) {
            this._offscreenContext = offscreenContext;
        } else {
            throw new Error("Could not get OffscreenCanvasRenderingContext2D.");
        }
    }
    drawSegment(lastPosition: Vector2D, position: Vector2D, color: string) {
        this._offscreenContext.strokeStyle = color;
        this._offscreenContext.lineWidth = PATH_THICKNESS * this.zoom;

        this._offscreenContext.beginPath();

        this._offscreenContext.moveTo(lastPosition.x, lastPosition.y);
        this._offscreenContext.lineTo(position.x, position.y)
        this._offscreenContext.stroke();
    }
    addSegments(objectStates: Map<number, ObjectState>) {
        objectStates.forEach((objectState, id) => {
            if (!objectState.body.movable) {
                return;
            }

            const position = objectState.position;
            const color = objectState.body.color;
            let path = this.get(id);
            if (!path) {
                path = new Path();
                this.set(id, path);
                path.addSegment(position, color);
                //this.drawSegment(position, color, true);
            } else {
                const lastPosition = path.lastPosition!;
                if (!position.equals(lastPosition, 0.5)) {
                    this.drawSegment(lastPosition, position, color);
                    path.addSegment(position, color);
                }
            }
        });
    }
    resize(width: number, height: number) {
        this._offscreenCanvas.width = width;
        this._offscreenCanvas.height = height;
    }
}