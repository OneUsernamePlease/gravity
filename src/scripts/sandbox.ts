// class that combines Simulation + Canvas (animation). move remaining things, that "combine" these from main to here.
// in main then use sandbox instead of Simulation and Canvas

import { Canvas } from "./canvas";
import { Simulation } from "./gravity";
import * as tsEssentials from "./essentials";
import { Vector2D } from "./vector2d";

export class Sandbox {
    private _canvas: Canvas
    private _simulation: Simulation;
    private _statusBar: { fields: HTMLElement[] } = { fields: [] };
    //#region get, set, constr
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
    constructor(canvas: Canvas, simulation: Simulation) {
        this._canvas = canvas;
        this._simulation = simulation;
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
    public initSandbox(canvasDimensions: {x: number, y: number}) {
        this.initCanvas(canvasDimensions.x, canvasDimensions.y);
        this.initSimulation();
    }
    public initCanvas(width: number, height: number) {
        const visibleCanvas = (document.getElementById("theCanvas")) as HTMLCanvasElement;
        this.canvas = new Canvas(visibleCanvas);
        this.canvas.visibleCanvas.width = width;
        this.canvas.visibleCanvas.height = height;
        this.canvas.animationSettings.displayVectors = tsEssentials.isChecked("cbxDisplayVectors");
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
    public zoomOut(zoomCenter: Vector2D, zoomStep: number) {
        this.canvas.zoomOut(new Vector2D(this.canvas.visibleCanvas.width / 2, this.canvas.visibleCanvas.height / 2));
        this.canvas.redrawSimulationState(this.simulation.simulationState, this.canvas.animationSettings.displayVectors);
        this.setStatusMessage(`Zoom: ${this.canvas.canvasSpace.zoomFactor} (m per pixel)`, 4);
    }
    public resumeSimulation() {
        if (!this.simulation.running) {
            this.simulation.run();
            this.drawRunningSimulation();
            this.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
            document.getElementById("btnToggleSim")!.innerHTML = "Pause";
        }
    }
    public pauseSimulation() {
        if (this.simulation.running) {
            this.canvas.animationRunning = false;
            this.simulation.pause();
            document.getElementById("btnToggleSim")!.innerHTML = "Play";
        }
    }
    public drawRunningSimulation() {
        if (this.canvas.animationRunning) {
            return;
        }
        this.canvas.animationRunning = true;
        const runDrawLoop = () => {
            if (this.canvas.animationRunning) {
                setTimeout(runDrawLoop, this.canvas.animationSettings.frameLength);
                this.canvas.redrawSimulationState(this.simulation.simulationState, this.canvas.animationSettings.displayVectors);
                this.setStatusMessage(`Simulation Tick: ${this.simulation.tickCount}`, 2);
                this.setStatusMessage(`Number of Bodies: ${this.simulation.simulationState.length}`, 1);
            }
        };
        runDrawLoop();
    }
    //#endregion
}