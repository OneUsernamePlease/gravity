import { ObjectState, SimulationSettings } from "@/types/types.js";
import { Vector2D } from "@/util/vector2d.js";
import * as c from "@/const/const.js";
import { clamp } from "@/util/util.js";
import { SimplePerformance } from "@/util/simple-performance.js";
import { Physics } from "./physics.js";
import { Quadtree } from "./quad-tree.js";
import { applyGravity, rebuildQuadtree } from "./barnes-hut.js";
import { BoundingBox } from "@/util/bounding-box.js";

export class Gravity {
    private _simulationState: Map<number, ObjectState>;
    private _quadtree: Quadtree<ObjectState>;
    private _nextId: number = 0;
    private _running: boolean;
    private _tickCount: number;
    private _tickLength: number;
    private _collisionDetection: boolean;
    private _elasticCollisions: boolean;
    private _g: number; // gravitational constant
    private _gravityRadiusExponent: number = 1;
    private _gravityReferenceDistance: number = 400;
    private _performance: SimplePerformance = new SimplePerformance();
    private readonly gravityLowerBounds: number = 1; // forces do not grow larger than for distances lower than this number
    private _cachedIds: number[] = [];
    private _bodiesBoundingBox: BoundingBox;
//#region get, set
    get simulationState() {
        return this._simulationState;
    }
    get quadtree() {
        return this._quadtree;
    }
    get tick() {
        return this._tickCount;
    }
    get running() {
        return this._running;
    }
    get collisionSettings(): { collisionDetection: boolean, elastic: boolean } {
        return { collisionDetection: this._collisionDetection, elastic: this._elasticCollisions };
    }
    get g(): number {
        return this._g;
    }
    get gravityExponent(): number {
        return this._gravityRadiusExponent;
    }
    get gravityReferenceDistance(): number {
        return this._gravityReferenceDistance;
    }
    /**
     * Total time the simulation has been running for in milliseconds. Does not increase while the simulation is stopped.
     */
    get totalTime(): number {
        return this._performance.elapsed;
    }
    get ticksLastSecond() {
        return this._performance.measurementsLastInterval;
    }
    get averageTicksPerSecond() {
        if (this.totalTime === 0) return 0;
        const elapsedSeconds = this.totalTime / 1000;
        return this._tickCount / elapsedSeconds;
    }

    set gravityExponent(e: number) {
        this._gravityRadiusExponent = e;
    }

    private set g(newG: number) {
        this._g = clamp(newG, c.MIN_G, c.MAX_G);
    }
    private set collisionDetection(collisionDetection: boolean) {
        this._collisionDetection = collisionDetection;
    }
    private set elasticCollisions(elastic: boolean) {
        this._elasticCollisions = elastic;
    }
// #endregion
    constructor() {
        this._simulationState = new Map();
        this._quadtree = new Quadtree(
            (objectState: ObjectState) => {
                return objectState.position;
            },
            new Vector2D(),
            0,
            1,
            32
        );
        this._bodiesBoundingBox = new BoundingBox({
            padding: 100,
            box: null,
        })

        this._nextId = 0;
        this._running = false;
        this._tickCount = 0;
        this._tickLength = 10; // ms
        this._collisionDetection = false;
        this._elasticCollisions = false;
        this._g = c.DEFAULT_G;
        this._cachedIds = [];
    }
    applySettings(settings: SimulationSettings): void {
        if (settings.collisionDetection !== undefined)       this.collisionDetection = settings.collisionDetection;
        if (settings.elasticCollisions !== undefined)        this.elasticCollisions = settings.elasticCollisions;
        if (settings.gravitationalConstant !== undefined)    this.g = settings.gravitationalConstant;
    }
    setBoundingBox(simulationState: Map<number, ObjectState>) {
        this._bodiesBoundingBox.reset();

        simulationState.forEach((objectState) => {
            this._bodiesBoundingBox.update(objectState);
        })
    }
    
    addObject(objectState: ObjectState): number  {
        if (!objectState.body.movable) {
            objectState.velocity = new Vector2D(0, 0);
        }
        this.simulationState.set(this._nextId++, objectState);
        
        this._bodiesBoundingBox.update(objectState);
        this._quadtree.setBoundsFromRect(this._bodiesBoundingBox.box);
        rebuildQuadtree(this.quadtree, this.simulationState);
        this._quadtree.add(objectState);

        this._cachedIds = Array.from(this.simulationState.keys());

        return this.simulationState.size;
    }
    stop() {
        this._running = false;

        this._performance.stop();
        this._performance.reset();
    }
    run() {
        if (this._running) {
            return;
        }
        this._running = true;

        this._performance.start();
        
        const runSimulationStep = () => {
            if (this._running) {
                setTimeout(runSimulationStep, this._tickLength);
                this.advanceTick();
            }
        };
        
        runSimulationStep();
    }
    reset() {
        this.clearObjects();
        this._bodiesBoundingBox.reset();
        this.quadtree.reset()
        this._tickCount = 0;
        this._performance.reset();
    }
    advanceTick() {        
        applyGravity(this._quadtree, this.simulationState, {
            g: this.g,
            gravityLowerBounds: this.gravityLowerBounds,
            gravityRadiusExponent: this.gravityExponent,
            gravityReferenceDistance: this.gravityReferenceDistance,
            deltaTInMs: this._tickLength,
            thetaThreshold: 0.5
        });
        if (this._collisionDetection) {
            this.handleCollisions();
        }

        this.setBoundingBox(this.simulationState);
        this._quadtree.setBoundsFromRect(this._bodiesBoundingBox.box);

        this._performance.measure();

        this._tickCount++;
    }
    private clearObjects() {
        this._simulationState.clear();
        this._nextId = 0;
        this._cachedIds = [];
    }
    private removeFromObjectStates(id: number) {
        this.simulationState.delete(id);
        this._cachedIds = Array.from(this.simulationState.keys());
    }
    private handleCollisions() {
        const ids = this._cachedIds;
        for (let i = 0; i < ids.length; i++) {
            const idI = ids[i];
            const objectStateI = this.simulationState.get(idI);
            if (!objectStateI) {
                continue; // elements in ids shift as bodies merge. just incrementing does not account for that
            }
            for (let j = i+1; j < ids.length; j++) {
                const idJ = ids[j];
                const objectStateJ = this.simulationState.get(idJ);
                if (!objectStateJ) {
                    continue; // ...still works in >99% of cases (collision last >1 frame). but it's not nice.
                }
                const distanceIJ = objectStateI.position.distance(objectStateJ.position);
                const collision = distanceIJ <= objectStateI.body.radius + objectStateJ.body.radius;
                if (collision) {
                    if (distanceIJ <= objectStateI.body.radius || distanceIJ <= objectStateJ.body.radius) { 
                        this.mergeBodies(idI, idJ);
                    } else if (this._elasticCollisions) {
                        Physics.elasticCollision(objectStateI, objectStateJ, c.DEFAULT_COLLISION_RESTITUTION)
                    }
                }
            }
        }
    }
    /**
     * Merges the two bodies with the given ids into one. The lighter body is merged into the heavier one. Momentum is preserved.
     */
    private mergeBodies(id1: number, id2: number) {
        const state1: ObjectState = this.simulationState.get(id1)!;
        const state2: ObjectState = this.simulationState.get(id2)!;
        const totalMomentum = state1.velocity.scale(state1.body.mass).add(state2.velocity.scale(state2.body.mass));
        const totalMass = state1.body.mass + state2.body.mass;
        const resultingVelocity = totalMomentum.scale(1 / totalMass);
        let changeObject: ObjectState;
        let removeId: number;

        if (state2.body.mass > state1.body.mass) {
            changeObject = state2;
            removeId = id1;
        } else {
            changeObject = state1;
            removeId = id2;
        }
        changeObject.velocity = resultingVelocity;
        changeObject.body.setProperties(totalMass);
        
        changeObject.body.movable = (state1.body.movable && state2.body.movable);
        if (!changeObject.body.movable) {
            changeObject.velocity = new Vector2D(0, 0);
        }
        this.removeFromObjectStates(removeId);
    }
    private placeBodiesTangentially(objectState1: ObjectState, objectState2: ObjectState) {
        const displacement = objectState1.position.displacementVector(objectState2.position);
        const displacementMag = displacement.magnitude()
        if (displacementMag === 0) {
            return;
        }
        const normalDisplacement = displacement.normalize();        
        const targetDistance = objectState1.body.radius + objectState2.body.radius;
        if (targetDistance === 0) {
            return;
        }
        const totalMoveDistance = targetDistance - displacementMag;
        const invMass1 = 1 / objectState1.body.mass;
        const invMass2 = 1 / objectState2.body.mass;

        const totalInvMass = invMass1 + invMass2;

        const moveBody1 = normalDisplacement.scale(
            totalMoveDistance * invMass1 / totalInvMass
        );

        const moveBody2 = normalDisplacement.scale(
            totalMoveDistance * invMass2 / totalInvMass
        );

        objectState1.position = objectState1.position.subtract(moveBody1);
        objectState2.position = objectState2.position.add(moveBody2);
    }
}
