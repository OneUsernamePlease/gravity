// class that combines Simulation + Canvas (animation). move remaining things, that "combine" these from main to here.
// in main then use sandbox instead of Simulation and Canvas

import { Canvas } from "./canvas";
import { Simulation } from "./gravity";
import * as tsEssentials from "./essentials";
import { Vector2D } from "./vector2d";
import { AnimationSettings } from "./types";

export class Sandbox {
    private _canvas: Canvas
    private _simulation: Simulation;
    private _statusBar: { fields: HTMLElement[] } = { fields: [] };
    private _animationSettings: AnimationSettings;
    
    private _animationRunning: boolean;
    //#region get, set, constr
    constructor(canvas: Canvas, simulation: Simulation) {
        this._canvas = canvas;
        this._simulation = simulation;
        this._animationSettings = { defaultScrollRate: 0.1, defaultZoomStep: 1, frameLength: 25, displayVectors: true, tracePaths: false };
        this._animationRunning = false;
    }
    set canvas(canvas: Canvas) {
        this._canvas = canvas;
    }
    get canvas() {
        return this._canvas;
    }
    set simulation(simulation: Simulation) {
        this._simulation = simulation;
    }
    get simulation() {
        return this._simulation;
    }
    set statusBar(statusBar: { fields: HTMLElement[] }) {
        this._statusBar = statusBar;
    }
    get statusBar() {
        return this._statusBar;
    }
    get animationSettings() {
        return this._animationSettings;
    }
    set animationSettings(animationSetting: AnimationSettings) {
        this._animationSettings = animationSetting;
    }
    get animationRunning() {
        return this._animationRunning;
    }
    set animationRunning(animationRunning: boolean) {
        this._animationRunning = animationRunning;
    }
    //#endregion
    //#region setup
    public initStatusBar() {
        const idBeginsWith = "statusText";
        let i = 1;
        let statusBarField = document.getElementById(idBeginsWith + i);
        while (statusBarField !== null) {
            this.statusBar.fields.push(statusBarField)
            i++;
            statusBarField = document.getElementById(idBeginsWith + i);
        }
    }
    public initSandbox(canvasDimensions: {x: number, y: number}, canvasId: string) {
        this.initCanvas(canvasDimensions.x, canvasDimensions.y, canvasId);
        this.initSimulation();
    }
    public initCanvas(width: number, height: number, id: string) {
        const visibleCanvas = (document.getElementById(id)) as HTMLCanvasElement;
        this.canvas = new Canvas(visibleCanvas);
        this.canvas.visibleCanvas.width = width;
        this.canvas.visibleCanvas.height = height;
        this.animationSettings.displayVectors = tsEssentials.isChecked("cbxDisplayVectors");
        this.setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
        
        // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
        // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
    }
    public initSimulation() {
        this.simulation = new Simulation();
        this.simulation.collisionDetection = tsEssentials.isChecked("cbxCollisions");
        this.simulation.elasticCollisions = tsEssentials.isChecked("cbxElasticCollisions");
    }
    //#endregion
    //#region output
    /**
     * @param fieldIndexOrId number of field, starting at one. OR id of the field
     */
    public setStatusMessage(newMessage: string, fieldIndexOrId?: number | string, append: boolean = false) {
        let element: HTMLElement;
        if (typeof fieldIndexOrId === "number") {
            element = this.statusBar.fields[fieldIndexOrId - 1];
        } else if (typeof fieldIndexOrId === "string") {
            element = document.getElementById(fieldIndexOrId)!;
        } else {
            element = this.statusBar.fields[0];
        }
        
        if (append) {
            element!.innerHTML += newMessage;
        } else {
            element!.innerHTML = newMessage;
        }
    }
    //#endregion
    //#region interaction
    /**
     * 
     * @param orientation "horizontal" | "vertical"
     * @param rate a number *0<rate<1* - the relative distance of the screen dimension (h/v) that one scroll step will move (ie. 0.1 will scroll 10% of the width/height in a horizontal/vertical direction)
     * @returns 
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
    public resumeSimulation() {
        if (!this.simulation.running) {
            this.simulation.run();
            this.drawRunningSimulation();
            this.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
        }
    }
    public pauseSimulation() {
        if (this.simulation.running) {
            this.animationRunning = false;
            this.simulation.pause();
        }
    }
    public drawRunningSimulation() {
        if (this.animationRunning) {
            return;
        }
        this.animationRunning = true;
        const runDrawLoop = () => {
            if (this.animationRunning) {
                setTimeout(runDrawLoop, this.animationSettings.frameLength);
                this.canvas.redrawSimulationState(this.simulation.simulationState, this.animationSettings.displayVectors);
                this.setStatusMessage(`Simulation Tick: ${this.simulation.tickCount}`, 2);
                this.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
            }
        };
        runDrawLoop();
    }
    //#endregion
}