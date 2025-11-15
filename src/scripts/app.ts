import { Canvas } from "./canvas";
import { Body2d } from "./gravity";
import * as tsEssentials from "./essentials";
import { Vector2D } from "./vector2d";
import { CanvasClickAction, ButtonState } from "./types";
import { UI } from "./ui";
import { GravityAnimationController } from "./gravity-animation-controller";
import * as c from "../const";

export class App {
    // this is going to be the app controller, managing ui and gravity sim+animation
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
    constructor(canvasId: string) {
        const canvas = new Canvas(document.getElementById(canvasId) as HTMLCanvasElement)
        this._gravityAnimationController = new GravityAnimationController(canvas);        
        this._ui = new UI();
    }
    //#endregion
    
    //#region setup
    public initialize() {
        this.initializeSettingsFromUI();
        this.initAnimationController({x: window.innerWidth, y: window.innerHeight});
        this.ui.initStatusBar(document.getElementById(c.STATUS_BAR_ID) as HTMLDivElement);        
    }
    public initAnimationController(canvasDimensions: {x: number, y: number}) {
        this.gravityAnimationController.initialize(canvasDimensions);
        this.ui.setStatusMessage(`Canvas dimension: ${canvasDimensions.x} * ${canvasDimensions.y}`, 5);
    }
    public initializeSettingsFromUI() {
        // REFACTOR ME: create a proper UI(+settings) object
        this.selectedCanvasClickAction = (document.querySelector('input[name="radioBtnMouseAction"]:checked') as HTMLInputElement).value;
        
        (document.getElementById("cbxElasticCollisions") as HTMLInputElement).disabled = !this.gravityAnimationController.simulation.collisionDetection;
    
        if ((document.getElementById("cbxDisplayVectors") as HTMLInputElement)?.checked) {
            this.ui.setStatusMessage("Green: acceleration - Red: velocity", 3);
        } else {
            this.ui.setStatusMessage("", 3);
        }
    
        this.setG(Number((document.getElementById("rangeG") as HTMLInputElement).value));
    }
    //#endregion

    //#region output/drawing
    public run() {
        this.gravityAnimationController.run();
        this.updateSimulationStatusMessages();
        document.getElementById("btnToggleSim")!.innerHTML = "Pause";
    }
    public advanceOneTick() {
        this.gravityAnimationController.advanceOneTick();
        this.updateSimulationStatusMessages();
    }
    public toggleSimulation() {
        if (this.running) {
            this.stop();
            (document.getElementById("btnNextStep") as HTMLInputElement)!.disabled = false;
        } else {
            this.run();
            (document.getElementById("btnNextStep") as HTMLInputElement)!.disabled = true;
        }
    }
    public reset() {
        this.gravityAnimationController.reset();
        this.updateSimulationStatusMessages();
    }
    public stop() {
        this.gravityAnimationController.stop();
        document.getElementById("btnToggleSim")!.innerHTML = "Play";
    }
    /**
     * Updates the status fields for tick count and number of bodies
     */
    private updateSimulationStatusMessages() {
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
    public zoomOut(zoomCenter: Vector2D, zoomStep?: number) {
        const newZoom = this.gravityAnimationController.canvasZoomOut(zoomCenter, zoomStep);
        this.ui.setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);

        //const zoomCenter = new Vector2D(app.canvas.visibleCanvas.width / 2, app.canvas.visibleCanvas.height / 2);
        //app.zoomOut(zoomCenter);
    }
    public zoomIn(zoomCenter: Vector2D, zoomStep?: number) {
        const newZoom = this.gravityAnimationController.canvasZoomIn(zoomCenter, zoomStep);
        this.ui.setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);
    }

    public zoomOutClicked() {
        const zoomCenter = new Vector2D(this.gravityAnimationController.width / 2, this.gravityAnimationController.height / 2);
        this.zoomOut(zoomCenter);
    }
    public zoomInClicked() {
        const zoomCenter = new Vector2D(this.gravityAnimationController.width / 2, this.gravityAnimationController.height / 2)
        this.zoomIn(zoomCenter);
    }
    public resizeCanvas(width: number, height: number) {
        this.gravityAnimationController.resizeCanvas(width, height);
        this.ui.setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
    }
    public massInputChanged(inputElement: HTMLInputElement) {
        this.ui.updateSelectedMass(inputElement);
    }
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
    public radioBtnMouseActionChanged(element: HTMLInputElement): void {
        if (element && element.type === 'radio') {
            this.selectedCanvasClickAction = element.value;
        }
    }
    public canvasSecondaryMouseDragging(movement: Vector2D){
        const movementInSimulationUnits = movement.scale(this.gravityAnimationController.zoom);
        this.scrollView({ x: -(movementInSimulationUnits.x), y: movementInSimulationUnits.y });
    }

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
    public canvasMainMouseUp(absoluteMousePosition: {x: number, y: number}) {
        
        switch (CanvasClickAction[this.selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
            case CanvasClickAction.None:
                break;
            case CanvasClickAction.AddBody:
                const bodyBeingAdded: Body2d = this.ui.body2dFromInputs();
                if (bodyBeingAdded.mass <= 0) { break; }


                const mousePositionVector = new Vector2D(absoluteMousePosition.x, absoluteMousePosition.y);
                const vel: Vector2D = this.gravityAnimationController.simulation.calculateVelocityBetweenPoints(this.gravityAnimationController.pointFromCanvasSpaceToSimulationSpace(this.lastMainMouseDownSimulationCoord), this.gravityAnimationController.pointFromCanvasSpaceToSimulationSpace(mousePositionVector));
                this.gravityAnimationController.addBody(bodyBeingAdded, mousePositionVector, vel);
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
