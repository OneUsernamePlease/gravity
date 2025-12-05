import { Vector2D } from "./vector2d";
import { UI } from "./ui";
import { GravityAnimationController } from "./gravity-animation-controller";
import * as c from "../const";

export class App {
    private _ui: UI;
    private _gravityAnimationController: GravityAnimationController;
    //#region get, set
    get gravityAnimationController() {
        return this._gravityAnimationController;
    }
    set gravityAnimationController(controller: GravityAnimationController) {
        this._gravityAnimationController = controller;
    }
    get ui() {
        return this._ui;
    }
    get running() {
        return this.gravityAnimationController.running;
    }
    // additional getters
    get selectedClickAction() {
        return this.ui.selectedClickAction;
    }
    //#endregion
    constructor() {
        this._gravityAnimationController = new GravityAnimationController(this);        
        this._ui = new UI(this);

        this.initialize();
    }
    private initialize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.gravityAnimationController.initialize(width, height);
        this.ui.initialize(width, height);
    }
    //#region control
    public run() {
        this.gravityAnimationController.run();
        this.ui.simulationResumed();
    }
    public stop() {
        this.gravityAnimationController.stop();
        this.ui.simulationStopped();
    }
    public toggleSimulation() {
        if (this.running) {
            this.stop();
        } else {
            this.run();
        }
    }
    public advanceOneTick() {
        this.gravityAnimationController.advanceOneTick();
        this.updateStatusBarSimulationInfo();
    }
    public reset() {
        this.gravityAnimationController.reset();
        this.updateStatusBarSimulationInfo();
    }
    /**
     * Updates the status fields for tick count, number of bodies
     */
    public updateStatusBarSimulationInfo() {
        this.ui.updateStatusBarTickCount(this.gravityAnimationController.tickCount);
        this.ui.updateStatusBarBodyCount(this.gravityAnimationController.bodyCount);
    }
    public updateStatusBarAnimationInfo() {
        this.ui.updateStatusBarZoom(this.gravityAnimationController.currentZoom);
    }
    //#endregion
    
    //#region interaction
    public scrollViewRight(distance?: number) {
        this.gravityAnimationController.scrollRight(distance);
    }
    public scrollViewLeft(distance?: number) {
        this.gravityAnimationController.scrollLeft(distance);
    }
    public scrollViewUp(distance?: number) {
        this.gravityAnimationController.scrollUp(distance);
    }
    public scrollViewDown(distance?: number) {
        this.gravityAnimationController.scrollDown(distance);
    }
    public setG(g: number) {
        this.gravityAnimationController.setG(g);
    }
    public zoomOut(zoomCenter?: Vector2D, zoomFactor: number = c.DEFAULT_ZOOM_FACTOR): number {
        const newZoom = this.gravityAnimationController.zoomOutByFactor(zoomCenter, zoomFactor);
        return newZoom;
    }
    public zoomIn(zoomCenter?: Vector2D, zoomFactor: number = c.DEFAULT_ZOOM_FACTOR) {
        const newZoom = this.gravityAnimationController.zoomInByFactor(zoomCenter, zoomFactor);
        return newZoom;
    }
    public resizeCanvas(width: number, height: number) {
        this.gravityAnimationController.resizeCanvas(width, height);
        this.ui.updateStatusBarCanvasDimensions(width, height);
    }
    public setCollisionDetection(collisionDetection: boolean, elasticCollisions = false) {
        this.gravityAnimationController.simulation.collisionDetection = collisionDetection;
        this.gravityAnimationController.simulation.elasticCollisions = elasticCollisions;
    }
    public setElasticCollisions(elasticCollisions: boolean) {
        this.gravityAnimationController.simulation.elasticCollisions = elasticCollisions;
    }
    public setDisplayVectors(displayVectors: boolean) {
        this.gravityAnimationController.setDisplayVectors(displayVectors)
    }
}
    //#endregion
