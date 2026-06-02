import { ObjectState } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import { AnimationController } from "./animation-controller.js";

export class Paths {
    private _paths: Map<number, Vector2D[]> = new Map();
    private _redraw: boolean = false;
    get paths() {
        return this._paths;
    }
    get pathArrays() {
        return Array.from(this._paths.values());
    }
    constructor(
        private _animation: AnimationController
    ) { }

    addSegments(objectStates: Map<number, ObjectState>) {
        objectStates.forEach((objectState, id) => {
            let path = this._paths.get(id);
            if (!path) {
                path = [];
                this._paths.set(id, path);
            }
            path.push(objectState.position);
        });
    }
    clear() {
        this._paths.clear();
    }
}