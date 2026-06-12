import { PATH_SEGMENT_MIN_LENGTH } from "../const/const.js";
import { ObjectState, PathCoordinate } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
export class Path extends Array<PathCoordinate> {
    private _lastCoordinate: PathCoordinate | null = null;
    constructor(
    ) { 
        super();
    }
    get lastCoordinate() {
        return this._lastCoordinate;
    }
    addSegment(position: Vector2D, color: string) {
        const pathCoordinate: PathCoordinate = {coordinate: position, color};
        this.push(pathCoordinate);
        this._lastCoordinate = {
            coordinate: position,
            color: color
        };
    }
}
export class Paths extends Map<number, Path> {
    get pathEnds(): Map<number, PathCoordinate> {
        const ends = new Map<number, PathCoordinate>();
        this.forEach((path, id) => {
            if (path.lastCoordinate) {
                ends.set(id, path.lastCoordinate)
            } 
        });
        return ends;
    }
    constructor(
    ) {
        super();
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
            } else {
                const lastPosition = path.lastCoordinate!;
                if (!position.equals(lastPosition.coordinate, PATH_SEGMENT_MIN_LENGTH)) {
                    
                    path.addSegment(position, color);
                }
            }
        });
    }
    reset(): void {
        this.clear();
    }
}