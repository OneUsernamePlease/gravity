import { Canvas } from "./canvas";
import { Body2d } from "./gravity";
import * as util from "./essentials";
import { Vector2D } from "./vector2d";
import { CanvasClickAction, ButtonState, IUI } from "./types";
import { UI } from "./ui";
import { GravityAnimationController } from "./gravity-animation-controller";
import * as c from "../const";

export class App {
    private _ui: UI;
    private _gravityAnimationController: GravityAnimationController;
    private _selectedCanvasClickAction: string = "";
    private lastMainMouseDownSimulationCoord: Vector2D = new Vector2D(0, 0);
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
    get selectedCanvasClickAction() {
        return this._selectedCanvasClickAction;
    }
    set selectedCanvasClickAction(clickAction: string) {
        this._selectedCanvasClickAction = clickAction;
    }
    get running() {
        return this.gravityAnimationController.running;
    }
    constructor() {
        this._gravityAnimationController = new GravityAnimationController(this);        
        this._ui = new UI(this);
        this.initializeSettingsFromUI();
        this.initAnimationController({x: window.innerWidth, y: window.innerHeight});
    }
    //#endregion
    
    //#region setup

    public initAnimationController(canvasDimensions: {x: number, y: number}) {
        this.gravityAnimationController.initialize(canvasDimensions.x, canvasDimensions.y);
        this.ui.setStatusMessage(`Canvas dimension: ${canvasDimensions.x} * ${canvasDimensions.y}`, 5);
    }
    public initializeSettingsFromUI() {
        this.selectedCanvasClickAction = this.ui.getSelectedClickAction();
        (document.querySelector('input[name="radioBtnMouseAction"]:checked') as HTMLInputElement).value;
        
        this.ui.elasticCollisionsCheckbox.disabled = !this.gravityAnimationController.simulation.collisionDetection;
    
        if (this.ui.displayVectorsCheckbox.checked) {
            this.ui.setStatusMessage("Green: acceleration - Red: velocity", 3);
        } else {
            this.ui.setStatusMessage("", 3);
        }
    
        this.setG(Number(this.ui.gravitationalConstantRangeInput.value));
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
    public redraw() {
        if (!this.running) {
            this.gravityAnimationController.redrawSimulation();
        }
    }
    //#endregion
    
    //#region interaction
    /* !!!!!! moved to gravity-animation-controller.ts - logic should be over there, being called from here */
    public getCanvasMousePosition(event: MouseEvent): Vector2D {
        const rect = this.gravityAnimationController.canvas.visibleCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return new Vector2D(x, y);
    }
    public absoluteToCanvasPosition(absolutePosition: Vector2D): Vector2D {
        const canvasRect = this.gravityAnimationController.canvas.visibleCanvas.getBoundingClientRect();
        const x = absolutePosition.x - canvasRect.left;
        const y = absolutePosition.y - canvasRect.top;
        return new Vector2D(x, y);
    }
    public scrollView(displacement: {x: number, y: number}) {
        this.gravityAnimationController.scrollView(displacement);
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
        const newZoom = this.gravityAnimationController.canvasZoomOut(zoomCenter, zoomStep);
        this.ui.setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);
        return newZoom;
    }
    public zoomIn(zoomCenter?: Vector2D, zoomStep?: number) {
        const newZoom = this.gravityAnimationController.canvasZoomIn(zoomCenter, zoomStep);
        this.ui.setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);
        return newZoom;
    }
    public resizeCanvas(width: number, height: number) {
        this.gravityAnimationController.resizeCanvas(width, height);
        this.ui.setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
    }

    // Move the appropriate logic to UI, rename functions for whatever's left
    public cbxCollisionsChanged(inputElement: HTMLInputElement) {
        const checked = inputElement.checked;
        const cbxElastic: HTMLInputElement = document.getElementById("cbxElasticCollisions") as HTMLInputElement;
        const elasticChecked = cbxElastic.checked;
        this.gravityAnimationController.simulation.collisionDetection = checked;
        this.gravityAnimationController.simulation.elasticCollisions = elasticChecked;
    
        cbxElastic.disabled = !checked;
    }
    public cbxElasticCollisionsChanged(element: HTMLInputElement) {
        this.gravityAnimationController.simulation.elasticCollisions = element.checked;
    }
    public numberInputGChanged(element: HTMLInputElement) {
        const newG: string = element.value;
        (document.getElementById("rangeG") as HTMLInputElement)!.value = newG;
        this.gravityAnimationController.setG(Number(newG));
    }
    public cbxDisplayVectorsChanged(checkbox: HTMLInputElement) {
        const displayVectors = checkbox ? checkbox.checked : false;
        this.gravityAnimationController.setDisplayVectors(displayVectors)
        if (displayVectors) {
            this.ui.setStatusMessage("Green: acceleration - Red: velocity", 3);
        } else {
            this.ui.setStatusMessage("", 3);
        }
    }
    public rangeInputGChanged(element: HTMLInputElement) {
        const newG: string = (element as HTMLInputElement).value;
        (document.getElementById("numberG") as HTMLInputElement)!.value = newG;
        this.setG(Number(newG));
    }

    public canvasSecondaryMouseDragging(movement: Vector2D){
        const movementInSimulationUnits = movement.scale(this.gravityAnimationController.zoom);
        this.scrollView({ x: -(movementInSimulationUnits.x), y: movementInSimulationUnits.y });
    }

    // MOVE TO G-ANIMATION-CONTROLLER
    // MOUSE AND TOUCH EVENTS THAT NEED SOME WORK DONE
    public canvasMainMouseDown(absoluteMousePosition: {x: number, y: number}) {
        switch (CanvasClickAction[this.selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
            case CanvasClickAction.None:
                break;
            case CanvasClickAction.AddBody:
                const positionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const positionInSimSpace: Vector2D = this.gravityAnimationController.pointFromCanvasSpaceToSimulationSpace(positionVector);
                this.lastMainMouseDownSimulationCoord = positionInSimSpace;
                break;
            default:
                break;
        }
    }
    public canvasMainMouseUp(absoluteMousePosition: Vector2D) {
        
        switch (CanvasClickAction[this.selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
            case CanvasClickAction.None:
                break;
            case CanvasClickAction.AddBody:
                const bodyBeingAdded: Body2d = this.ui.body2dFromInputs();
                if (bodyBeingAdded.mass <= 0) { break; }
                const mousePositionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const mousePositionOnCanvas: Vector2D = this.absoluteToCanvasPosition(mousePositionVector);
                const mousePositionInSimSpace: Vector2D = this.gravityAnimationController.pointFromCanvasSpaceToSimulationSpace(mousePositionOnCanvas);
                const vel: Vector2D = this.gravityAnimationController.simulation.calculateVelocityBetweenPoints(this.lastMainMouseDownSimulationCoord, mousePositionInSimSpace);
                this.gravityAnimationController.addBody(bodyBeingAdded, mousePositionInSimSpace, vel);
                this.ui.setStatusMessage(`Number of Bodies: ${this.gravityAnimationController.simulation.simulationState.length}`, 1);
                break;
            default:
                break;
        }
        this.redraw();
    }
    public secondaryMouseUp() {
        
    }
    /*
    public canvasTouchStart(ev: TouchEvent) {
        this.canvasMainMouseState = ButtonState.Down;

        switch (CanvasClickAction[this.selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
            case CanvasClickAction.None:
                break;
            case CanvasClickAction.AddBody:
                ev.preventDefault();
                this.lastMainMouseDownCanvasCoord = this.canvas.getCanvasTouchPosition(ev);
                break;
            default:
                break;
        }
    }
    public canvasTouchEnd(ev: TouchEvent) {
        this.canvasMainMouseState = ButtonState.Up;
        const touchPosition = this.canvas.getCanvasTouchEndPosition(ev);
        if (touchPosition.x > this.canvas.visibleCanvas.width || touchPosition.y > this.canvas.visibleCanvas.height || touchPosition.x < 0 || touchPosition.y < 0) {
            return;
        }

        switch (CanvasClickAction[this.selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
            case CanvasClickAction.None:
                break;
            case CanvasClickAction.AddBody:
                const bodyBeingAdded = this.ui.body2dFromInputs();    
                if (bodyBeingAdded.mass <= 0) { break; }
                const vel: Vector2D = this.simulation.calculateVelocityBetweenPoints(this.canvas.pointFromCanvasSpaceToSimulationSpace(this.lastMainMouseDownCanvasCoord), this.canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition));
                this.simulation.addObject(bodyBeingAdded, this.canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition), vel);
                this.ui.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
                break;
            default:
                break;
        }
        if (!this.running) {
            this.gravityAnimationController.redrawSimulation();
        }
    }
    */
}
    //#endregion
