import { PATH_LENGTH } from "../const/const.js";
import { ObjectState } from "../types/types.js";
import { RingBuffer } from "../util/ring-buffer.js";
import { Vector2D } from "../util/vector2d.js";
import { AnimationController } from "./animation-controller.js";
interface PathSegment {
    coordinate: Vector2D,
    color: string,
}
export class Path extends RingBuffer<PathSegment> {
    constructor(
        private _maxLength: number
    ) { 
        super(_maxLength);
    }
}
export class Paths {
    private _paths: Map<number, Path> = new Map();
    private _redraw: boolean = false;
    get paths() {
        return this._paths;
    }
    get pathArrays(): Path[] {
        return Array.from(this._paths.values());
    }
    constructor(
        private _animation: AnimationController
    ) { }

    addSegments(objectStates: Map<number, ObjectState>) {
        objectStates.forEach((objectState, id) => {
            if (!objectState.body.movable) {
                return;
            }

            let path = this._paths.get(id);
            if (!path) {
                path = new Path(PATH_LENGTH);
                this._paths.set(id, path);
            }
            path.add({
                coordinate: objectState.position,
                color: objectState.body.color
            });
        });
    }
    clear() {
        this._paths.clear();
    }
}