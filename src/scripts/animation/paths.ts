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
    toVectorArray(): Vector2D[] {
        const segmentArray = super.toArray();
        const vectorArray = new Array<Vector2D>(segmentArray.length)
        for (let i = 0; i < segmentArray.length; i++) {
            vectorArray[i] = segmentArray[i].coordinate;
        }
        return vectorArray;
    }
}
export class Paths extends Map<number, Path> {
    get pathArrays(): Path[] {
        return Array.from(this.values());
    }
    constructor(
        private _animation: AnimationController
    ) {
        super();
    }

    addSegments(objectStates: Map<number, ObjectState>) {
        objectStates.forEach((objectState, id) => {
            if (!objectState.body.movable) {
                return;
            }

            let path = this.get(id);
            if (!path) {
                path = new Path(PATH_LENGTH);
                this.set(id, path);
            }
            path.add({
                coordinate: objectState.position,
                color: objectState.body.color
            });
        });
    }
}