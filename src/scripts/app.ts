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
        return this.ui.getSelectedValue(this.ui.clickAction) ?? this.ui.clickAction.buttons[0].value;
    }
    //#endregion
    constructor() {
        this._gravityAnimationController = new GravityAnimationController(this);        
        this._ui = new UI(this);

        this.initialize();
    }
    private initialize() {
        this.gravityAnimationController.initialize(window.innerWidth, window.innerHeight);
        this.ui.initialize();
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
        this.updateStatusBarSimulationMessages();
    }
    public reset() {
        this.gravityAnimationController.reset();
        this.updateStatusBarSimulationMessages();
    }
    public updateStatusBarBodyCount() {
        this.ui.setStatusMessage(`Number of Bodies: ${this.gravityAnimationController.bodyCount}`, 1);
    }
    public updateStatusBarTickCount() {
        this.ui.setStatusMessage(`Simulation Tick: ${this.gravityAnimationController.tickCount}`, 2);
    }
    /**
     * Updates the status fields for tick count and number of bodies
     */
    public updateStatusBarSimulationMessages() {
        this.updateStatusBarTickCount();
        this.updateStatusBarBodyCount();
    }
    public updateStatusBarZoom() {
        this.ui.updateStatusBarZoom();
    }
    //#endregion
    

    //#region interaction
    public scrollViewRight(distance?: number) {
        this.gravityAnimationController.canvasScrollRight(distance);
    }
    public scrollViewLeft(distance?: number) {
        this.gravityAnimationController.canvasScrollLeft(distance);
    }
    public scrollViewUp(distance?: number) {
        this.gravityAnimationController.canvasScrollUp(distance);
    }
    public scrollViewDown(distance?: number) {
        this.gravityAnimationController.canvasScrollDown(distance);
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
        this.ui.setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
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
