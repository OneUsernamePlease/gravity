import { Canvas } from "./canvas";
import { Body2d, Simulation } from "./gravity";
import { ObjectState } from "./types";
import { Vector2D } from "./vector2d";
import { App } from "./app";
import { DEFAULT_SCROLL_RATE, DEFAULT_ZOOM_FACTOR } from "../const";
import { InteractionManager } from "./interaction-manager";
import { AnimationController } from "./animation-controller";

export class GravityAnimationController {
    private _simulation: Simulation;
    private _running: boolean;
    private _interaction: InteractionManager;
    private _animation: AnimationController;
    // ---
//#region get, set
    get simulation(): Simulation {
        return this._simulation;
    }
    set simulation(simulation: Simulation) {
        this._simulation = simulation;
    }
    get running(): boolean {
        return this._running;
    }
    private set running(running: boolean) {
        this._running = running;
    }
    get animation(): AnimationController {
        return this._animation;
    }
    set animation(animation: AnimationController) {
        this._animation = animation;
    }
    // additional getters
    get tickCount(): number {
        return this.simulation.tickCount;
    }
    get bodyCount(): number {
        return this.simulation.simulationState.length;
    }
    get width(): number {
        return this.animation.width;
    }
    get height(): number {
        return this.animation.height;
    }
    get currentZoom(): number {
        return this.animation.currentZoom;
    }
    get currentSimulationState(): ObjectState[] {
        return this.simulation.simulationState;
    }
    get canvasSpace() {
        return this.animation.canvasSpace;
    }
//#endregion
//#region initialization

    // REPLACE PROPERTY APP WITH UI
    constructor(private app: App, elementId: string = "theCanvas") {
        const canvasElement: HTMLCanvasElement = document.getElementById(elementId) as HTMLCanvasElement;
        if (!canvasElement) {
            throw new Error(`Canvas element with id '${elementId}' not found.`);
        }
        const canvas = new Canvas(canvasElement);
        this._simulation = new Simulation;
        this._animation = new AnimationController(canvas, this);
        this._interaction = new InteractionManager(canvas, this, this.app);
        this._running = false;
    }

    public initialize(width: number, height: number) {
        this.animation.initialize(width, height, this.app.ui.animationSettings);
        this.initSimulation();
    }
    private initSimulation() {
        this.simulation.collisionDetection = this.app.ui.collisionDetectionCheckbox.checked;
        this.simulation.elasticCollisions = this.app.ui.elasticCollisionsCheckbox.checked;
    }
//#endregion

//#region control methods
    public run() {
        if (!this.running) {
            this.running = true;
            this.simulation.run();
            this.animation.run();
        }
    }
    public stop() {
        this.running = false;
        this.simulation.pause();
        this.animation.stop();
    }
    public toggle() {
        if (this.running) {
            this.stop();
        } else {
            this.run();
        }
    }
    public reset() {
        this.simulation.reset();
        this.animation.redrawIfPaused();
    }
    public advanceOneTick() {
        if (this.running) {
            return;
        }
        this.simulation.advanceTick();
        this.animation.redrawIfPaused();
    }
//#endregion

//#region interaction
    public setDisplayVectors(displayVectors: boolean) {
        this.animation.setDisplayVectors(displayVectors);
    }
    public setCollisionDetection(collisionDetection: boolean, elasticCollisions = false) {
        this.simulation.collisionDetection = collisionDetection;
        this.simulation.elasticCollisions = elasticCollisions;
    }
    public setElasticCollisions(elasticCollisions: boolean) {
        this.simulation.elasticCollisions = elasticCollisions;
    }
    public updateStatusBarSimulationMessages() {
        this.app.updateStatusBarSimulationInfo();
    }
    public updateStatusBarAnimationInfo() {
        this.app.updateStatusBarAnimationInfo();
    }
    public addBody(body: Body2d, position: Vector2D, velocity: Vector2D = new Vector2D(0, 0)) {
        this.simulation.addObject(body, position, velocity);        
        this.animation.redrawIfPaused();
    }
    public setG(g: number) {
        this.simulation.g = g;
    }
    public scrollInCanvasUnits(movementOnCanvas: Vector2D){
        const movementInSimulationUnits = movementOnCanvas.scale(this.currentZoom);
        this.animation.scroll({ x: -(movementInSimulationUnits.x), y: movementInSimulationUnits.y });
    }
    public scrollRight(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal"); // in simulationUnits
        }
        this.animation.scroll({x: distance, y: 0});
    }
    public scrollLeft(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal"); // in simulationUnits
        }
        this.animation.scroll({x: -distance, y: 0});
    }
    public scrollUp(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.animation.scroll({x: 0, y: distance});
    }
    public scrollDown(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical"); // in simulationUnits
        }
        this.animation.scroll({x: 0, y: -distance});
    }
    private scrollDistance(orientation: "horizontal" | "vertical", rate: number = DEFAULT_SCROLL_RATE): number {
        switch (orientation) {
            case "horizontal":
                return this.width * rate * this.currentZoom;
            case "vertical":
                return this.height * rate * this.currentZoom;
        }
    }
    public zoomToFactor(factor: number, zoomCenter: Vector2D): number {
        return this.animation.zoomToFactor(factor, zoomCenter);
    }
    public zoomIn(
        zoomCenter: Vector2D = new Vector2D(this.width / 2, this.height / 2),
        factor: number = DEFAULT_ZOOM_FACTOR, 
    ): number {
        const zoomStep = this.currentZoom * factor;
        const newZoom = this.animation.zoomIn(zoomCenter, zoomStep);

        // Refactor me. this calls app, which should be removed
        this.updateStatusBarAnimationInfo();

        return newZoom;
    }
    public zoomOut(
        zoomCenter: Vector2D = new Vector2D(this.width / 2, this.height / 2),
        factor: number = DEFAULT_ZOOM_FACTOR, 
    ): number {
        const zoomStep = this.currentZoom * factor;
        const newZoom = this.animation.zoomOut(zoomCenter, zoomStep);

        this.updateStatusBarAnimationInfo();

        return newZoom;
    }
    public resizeCanvas(width: number, height: number) {
        this.animation.resizeCanvas(width, height);
    }
//#endregion
}