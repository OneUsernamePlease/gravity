"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Body2d = void 0;
class Body2d {
    //#region constructor, get, set
    get mass() {
        return this._mass;
    }
    set mass(newMass) {
        this._mass = newMass;
    }
    get radius() {
        return this._radius;
    }
    set radius(newRadius) {
        this._radius = newRadius;
    }
    get movable() {
        return this._movable;
    }
    set movable(affected) {
        this._movable = affected;
    }
    constructor(mass, radius) {
        this.defaultDensity = 1;
        if (mass === undefined) {
            mass = 0;
        }
        this.mass = mass;
        if (radius === undefined) {
            radius = ((3 * this.mass) / (4 * Math.PI * this.defaultDensity)) ** (1 / 3);
        }
        this.radius = radius;
        this.movable = true;
    }
}
exports.Body2d = Body2d;
//# sourceMappingURL=gravity.js.map