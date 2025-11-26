import { Body2d } from "./gravity";
import { Vector2D } from "./vector2d";
import { PointerAction } from "./types";
import { UI } from "./ui";
import { GravityAnimationController } from "./gravity-animation-controller";
import { mouse } from "../const";

export class App {
    private _ui: UI;
    private _gravityAnimationController: GravityAnimationController;
    //#region get, set, constr
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
    constructor() {
        this._gravityAnimationController = new GravityAnimationController(this);        
        this._ui = new UI(this);

        this.initialize();
    }
    private initialize() {
        this.gravityAnimationController.initialize(window.innerWidth, window.innerHeight);
        this.ui.initialize();
    }
    //#endregion

    //#region output/drawing
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
        this.updateSimulationStatusMessages();
    }
    public reset() {
        this.gravityAnimationController.reset();
        this.updateSimulationStatusMessages();
    }
    /**
     * Updates the status fields for tick count and number of bodies
     */
    public updateSimulationStatusMessages() {
        // maybe add optional parameters for which status fields to update
        this.ui.setStatusMessage(`Simulation Tick: ${this.gravityAnimationController.tickCount}`, 2);
        this.ui.setStatusMessage(`Number of Bodies: ${this.gravityAnimationController.bodyCount}`, 1);
    }
    public updateZoomStatusMessage() {
        this.ui.updateStatusBarZoom();
    }
    public redraw() {
        if (!this.running) {
            this.gravityAnimationController.redrawSimulation();
        }
    }
    //#endregion
    
    //#region interaction
    /* !!!!!! moved to gravity-animation-controller.ts - logic should be over there, being called from here */
    public absoluteToCanvasPosition(absolutePosition: Vector2D): Vector2D {
        const canvasRect = this.gravityAnimationController.canvas.visibleCanvas.getBoundingClientRect();
        const x = absolutePosition.x - canvasRect.left;
        const y = absolutePosition.y - canvasRect.top;
        return new Vector2D(x, y);
    }
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
    public zoomOut(zoomCenter?: Vector2D, zoomStep?: number): number {
        const newZoom = this.gravityAnimationController.zoomOut(zoomCenter, zoomStep);
        return newZoom;
    }
    public zoomIn(zoomCenter?: Vector2D, zoomStep?: number) {
        const newZoom = this.gravityAnimationController.zoomIn(zoomCenter, zoomStep);
        return newZoom;
    }
    public resizeCanvas(width: number, height: number) {
        this.gravityAnimationController.resizeCanvas(width, height);
        this.ui.setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
    }

    // Move the appropriate logic to UI, rename functions for whatever's left
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
    public scrollCanvas(movementOnCanvas: Vector2D){
        const movementInSimulationUnits = movementOnCanvas.scale(this.gravityAnimationController.zoom);
        this.gravityAnimationController.scrollView({ x: -(movementInSimulationUnits.x), y: movementInSimulationUnits.y });
    }

    // MOVE TO G-ANIMATION-CONTROLLER
    public canvasMainMouseDown(absoluteMousePosition: {x: number, y: number}) {
        switch (PointerAction[this.ui.getSelectedClickAction() as keyof typeof PointerAction]) {
            case PointerAction.None:
                break;
            case PointerAction.AddBody:
                const positionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const positionInSimSpace: Vector2D = this.gravityAnimationController.pointFromCanvasSpaceToSimulationSpace(positionVector);
                mouse.main.downCoordinatesInSimSpace = positionInSimSpace;
                break;
            default:
                break;
        }
    }
    public canvasMainMouseUp(absoluteMousePosition: Vector2D) {
        switch (PointerAction[this.ui.getSelectedClickAction() as keyof typeof PointerAction]) {
            case PointerAction.None:
                break;
            case PointerAction.AddBody:
                const bodyBeingAdded: Body2d = this.ui.body2dFromInputs();
                if (bodyBeingAdded.mass <= 0) { break; }
                const mousePositionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const mousePositionOnCanvas: Vector2D = this.absoluteToCanvasPosition(mousePositionVector);
                const mousePositionInSimSpace: Vector2D = this.gravityAnimationController.pointFromCanvasSpaceToSimulationSpace(mousePositionOnCanvas);
                const vel: Vector2D = this.gravityAnimationController.simulation.calculateVelocityBetweenPoints(mouse.main.downCoordinatesInSimSpace!, mousePositionInSimSpace);
                this.gravityAnimationController.addBody(bodyBeingAdded, mousePositionInSimSpace, vel);
                this.ui.setStatusMessage(`Number of Bodies: ${this.gravityAnimationController.simulation.simulationState.length}`, 1);
                break;
            default:
                break;
        }
        this.redraw();
    }
}
    //#endregion
