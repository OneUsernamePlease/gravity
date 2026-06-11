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
interface BoundingBox {
    left: number,
    right:number,
    top:number,
    bottom:number,
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
    private _pathEnds: Map<number, Vector2D> = new Map();
    get zoom() {
        return this._canvas.currentZoom;
    }
    constructor(
        private _canvas: Canvas,
    ) {
        super();
    }
    /* drawSegment(lastPosition: Vector2D, position: Vector2D, color: string) {
        this._offscreenContext.strokeStyle = color;
        this._offscreenContext.lineWidth = PATH_THICKNESS * this.zoom;

        this._offscreenContext.beginPath();

        this._offscreenContext.moveTo(lastPosition.x, lastPosition.y);
        this._offscreenContext.lineTo(position.x, position.y)
        this._offscreenContext.stroke();
    } */
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

                this._pathEnds.set(id, position);

                path.addSegment(position, color);
            } else {
                const lastPosition = path.lastPosition!;
                if (!position.equals(lastPosition, 0.5)) {
                    this._pathEnds.set(id, position);
                    
                    path.addSegment(position, color);
                }
            }
        });
    }
    reset(): void {
        this.clear();
        this._pathEnds.clear();
    }
}