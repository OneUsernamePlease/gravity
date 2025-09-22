import { Canvas } from "./canvas";
import { Body2d, Simulation } from "./gravity";
import * as tsEssentials from "./essentials";
import { Vector2D } from "./vector2d";
import { AnimationSettings, CanvasClickAction, MouseBtnState } from "./types";
import { Inputs } from "./inputs";

export class Sandbox {
    private _canvas: Canvas;
    private _simulation: Simulation;
    private _inputs: Inputs;
    private _statusBar: { fields: HTMLSpanElement[] } = { fields: [] };
    private _animationSettings: AnimationSettings;
    private _running: boolean;
    private _canvasMainMouseState: MouseBtnState = MouseBtnState.Up; // Refactor me: -> this is canvas stuff
    private _canvasSecondaryMouseState: MouseBtnState = MouseBtnState.Up; // Refactor me: -> this is canvas stuff
    private _lastMainMouseDownCanvasCoord: Vector2D = new Vector2D (0, 0); // Refactor me: -> this is canvas stuff
    private _lastSecondaryMouseDownCanvasCoord: Vector2D = new Vector2D (0, 0); // Refactor me: -> this is canvas stuff
    private _selectedCanvasClickAction: string = "";
    //#region get, set, constr
    constructor(canvas: Canvas) {
        this._canvas = canvas;
        this._simulation = new Simulation;
        this._inputs = new Inputs();
        this._animationSettings = { defaultScrollRate: 0.1, defaultZoomStep: 1, frameLength: 25, displayVectors: true, tracePaths: true };
        this._running = false;
    }
    get canvas() {
        return this._canvas;
    }
    get simulation() {
        return this._simulation;
    }
    get inputs() {
        return this._inputs;
    }
    get statusBar() {
        return this._statusBar;
    }
    get animationSettings() {
        return this._animationSettings;
    }
    get running() {
        return this._running;
    }
    set running(running: boolean) {
        this._running = running;
    }
    get canvasMainMouseState() {
        return this._canvasMainMouseState;
    }
    set canvasMainMouseState(state: MouseBtnState) {
        this._canvasMainMouseState = state;
    }
    get canvasSecondaryMouseState() {
        return this._canvasSecondaryMouseState;
    }
    set canvasSecondaryMouseState(state: MouseBtnState) {
        this._canvasSecondaryMouseState = state;
    }
    get lastMainMouseDownCanvasCoord() {
        return this._lastMainMouseDownCanvasCoord;
    }
    set lastMainMouseDownCanvasCoord(coordinates: Vector2D) {
        this._lastMainMouseDownCanvasCoord = coordinates;
    }
    get lastSecondaryMouseDownCanvasCoord() {
        return this._lastSecondaryMouseDownCanvasCoord;
    }
    set lastSecondaryMouseDownCanvasCoord(coordinates: Vector2D) {
        this._lastSecondaryMouseDownCanvasCoord = coordinates;
    }
    get selectedCanvasClickAction() {
        return this._selectedCanvasClickAction;
    }
    set selectedCanvasClickAction(clickAction: string) {
        this._selectedCanvasClickAction = clickAction;
    }
    //#endregion
    //#region setup
    /**
     * generates an internal array of status-bar-field for later use.
     * @param fieldIdBeginsWith the status bar's fields' ids have the same start followed by a number (starting at 1)
     */
    public initStatusBar(statusBar: HTMLDivElement) {
        const statusBarFields = statusBar.querySelectorAll<HTMLSpanElement>(".statusBarItem");
        statusBarFields.forEach(field => {
            this.statusBar.fields.push(field);
        });
    }
    public initCanvasAndSimulation(canvasDimensions: {x: number, y: number}) {
        this.initCanvas(canvasDimensions.x, canvasDimensions.y);
        this.initSimulation();
    }
    public initCanvas(width: number, height: number) {
        this.canvas.visibleCanvas.width = width;
        this.canvas.visibleCanvas.height = height;
        this.animationSettings.displayVectors = tsEssentials.isChecked("cbxDisplayVectors");
        this.setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
        // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
        // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
    }
    public initSimulation() {
        this.simulation.collisionDetection = tsEssentials.isChecked("cbxCollisions");
        this.simulation.elasticCollisions = tsEssentials.isChecked("cbxElasticCollisions");
    }
    //#endregion
    //#region events and settings
    public resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
    }
    public canvasTouchStart(ev: TouchEvent) {
        this.canvasMainMouseState = MouseBtnState.Down;
    
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
        this.canvasMainMouseState = MouseBtnState.Up;
        const touchPosition = this.canvas.getCanvasTouchEndPosition(ev);
        if (touchPosition.x > this.canvas.visibleCanvas.width || touchPosition.y > this.canvas.visibleCanvas.height || touchPosition.x < 0 || touchPosition.y < 0) {
            return;
        }

        switch (CanvasClickAction[this.selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
            case CanvasClickAction.None:
                break;
            case CanvasClickAction.AddBody:
                const bodyBeingAdded = this.inputs.body2dFromInputs();    
                if (bodyBeingAdded.mass <= 0) { break; }
                const vel: Vector2D = this.simulation.calculateVelocityBetweenPoints(this.canvas.pointFromCanvasSpaceToSimulationSpace(this.lastMainMouseDownCanvasCoord), this.canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition));
                this.simulation.addObject(bodyBeingAdded, this.canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition), vel);
                this.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
                break;
            default:
                break;
        }
        if (!this.running) {
            this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
        }

    }
    public mainMouseDown(ev: MouseEvent) {
        this.canvasMainMouseState = MouseBtnState.Down;
        this.lastMainMouseDownCanvasCoord = this.canvas.getCanvasMousePosition(ev);
    }
    public mainMouseUp(ev: MouseEvent) {
        if (this.canvasMainMouseState === MouseBtnState.Up) {
            return;
        }
        this.canvasMainMouseState = MouseBtnState.Up;
        const mousePosition: Vector2D = this.canvas.getCanvasMousePosition(ev);
        
        switch (CanvasClickAction[this.selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
            case CanvasClickAction.None:
                break;
            case CanvasClickAction.AddBody:
                const bodyBeingAdded: Body2d = this.inputs.body2dFromInputs();
                if (bodyBeingAdded.mass <= 0) { break; }
                const vel: Vector2D = this.simulation.calculateVelocityBetweenPoints(this.canvas.pointFromCanvasSpaceToSimulationSpace(this.lastMainMouseDownCanvasCoord), this.canvas.pointFromCanvasSpaceToSimulationSpace(mousePosition));
                this.simulation.addObject(bodyBeingAdded, this.canvas.pointFromCanvasSpaceToSimulationSpace(mousePosition), vel);
                this.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
                break;
            default:
                break;
        }
        if (!this.running) {
            this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
        }
    }
    public secondaryMouseDown(ev: MouseEvent) {
        this.canvasSecondaryMouseState = MouseBtnState.Down;
        this.lastSecondaryMouseDownCanvasCoord = this.canvas.getCanvasMousePosition(ev);
        console.log(this.lastSecondaryMouseDownCanvasCoord);
    }
    public secondaryMouseUp(ev: MouseEvent) {
        ev.preventDefault();
        this.canvasSecondaryMouseState = MouseBtnState.Up;
    }
    public mouseMoving(ev: MouseEvent) {
        if (this.canvasSecondaryMouseState === MouseBtnState.Down) {
            const currentPointerPosition = this.canvas.getCanvasMousePosition(ev);
            const currentDisplacement = currentPointerPosition.subtract(this.lastSecondaryMouseDownCanvasCoord);
            const displacementSimulationUnits = currentDisplacement.scale(this.canvas.canvasSpace.currentZoom);
            this.canvas.moveCanvas(new Vector2D(-(displacementSimulationUnits.x), displacementSimulationUnits.y));
            
            this.lastSecondaryMouseDownCanvasCoord = currentPointerPosition;

            if (!this.running) {
                this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
            }
        }
    }
    public massInputChanged(inputElement: HTMLInputElement) {
        this.inputs.updateSelectedMass(inputElement);
    }
    //#endregion
    //#region output/drawing
    public runAnimation() {
        if (this.running) {
            return;
        }
        this.running = true;
        const loop = () => {
            if (this.running) {
                setTimeout(loop, this.animationSettings.frameLength);
                this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
                this.updateSimulationStatusMessages();
            }
        };   
        loop();
    }
    /**
     * @param fieldIndexOrId number of field (starting at one) OR id of the field
     */
    public setStatusMessage(message: string, fieldIndexOrId?: number | string, append: boolean = false) {
        let element: HTMLElement;
        if (typeof fieldIndexOrId === "number") {
            element = this.statusBar.fields[fieldIndexOrId - 1];
        } else if (typeof fieldIndexOrId === "string") {
            element = document.getElementById(fieldIndexOrId)!;
        } else {
            element = this.statusBar.fields[0];
        }
        
        if (append) {
            element!.innerHTML += message;
        } else {
            element!.innerHTML = message;
        }
    }
    /**
     * Updates the status fields for tick count and number of bodies
     */
    private updateSimulationStatusMessages() {
        this.setStatusMessage(`Simulation Tick: ${this.simulation.tickCount}`, 2);
        this.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
    }
    //#endregion
    //#region interaction
    /**
     * Calculates the distance of the screen dimension (h/v) that one scroll step will move (ie. 0.1 will scroll 10% of the width/height in a horizontal/vertical direction)
     * @param orientation "horizontal" | "vertical"
     * @param rate a number *0 < rate < 1* - defaults to animationSettings.defaultScrollRate 
     * @returns the distance in simulationUnits
     */
    private defaultScrollDistance(orientation: "horizontal" | "vertical", rate?: number): number {
        if (rate === undefined) { rate = this.animationSettings.defaultScrollRate; }
        switch (orientation) {
            case "horizontal":
                return this.canvas.visibleCanvas.width * rate * this.canvas.canvasSpace.currentZoom;
            case "vertical":
                return this.canvas.visibleCanvas.height * rate * this.canvas.canvasSpace.currentZoom;
        }
    }
    public moveCanvasRight(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("horizontal"); // in simulationUnits
        }
        this.canvas.moveCanvasRight(distance);
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
    }
    public moveCanvasLeft(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("horizontal"); // in simulationUnits
        }
        this.canvas.moveCanvasLeft(distance);
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
    }
    public moveCanvasUp(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("vertical"); // in simulationUnits
        }
        this.canvas.moveCanvasUp(distance);
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
    }
    public moveCanvasDown(distance?: number) {
        if (distance === undefined) {
            distance = this.defaultScrollDistance("vertical"); // in simulationUnits
        }
        this.canvas.moveCanvasDown(distance);
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
    }
    public zoomOut(zoomCenter: Vector2D, zoomStep?: number) {
        if (zoomStep === undefined) {
            zoomStep = this.animationSettings.defaultZoomStep;
        }
        this.canvas.zoomOut(zoomCenter, zoomStep);
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
        this.setStatusMessage(`Zoom: ${this.canvas.canvasSpace.currentZoom} (m per pixel)`, 4);
    }
    public zoomIn(zoomCenter: Vector2D, zoomStep?: number) {
        if (zoomStep === undefined) {
            zoomStep = this.animationSettings.defaultZoomStep;
        }
        this.canvas.zoomIn(zoomCenter, zoomStep);
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
        this.setStatusMessage(`Zoom: ${this.canvas.canvasSpace.currentZoom} (m per pixel)`, 4);
    }
    public advanceSimulation() {
        if (this.running) {
            return;
        }
        this.simulation.advanceTick();
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
        this.updateSimulationStatusMessages();
    }
    private runSimulation() {
        if (!this.running) {
            document.getElementById("btnToggleSim")!.innerHTML = "Pause";
            this.simulation.run();
            this.runAnimation();
        }
    }
    public toggleSimulation() {
        if (this.running) {
            this.stop();
        } else {
            this.run();
        }
    }
    public reset() {
        this.simulation.reset();
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
        this.updateSimulationStatusMessages();
    }
    public run() {
        this.runSimulation();
        this.runAnimation();
    }
    public stop() {
        this.running = false;
        this.simulation.pause();
        document.getElementById("btnToggleSim")!.innerHTML = "Play";
    }
    //#endregion
}