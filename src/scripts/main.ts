import { InferCustomEventPayload } from "vite";
import { Body2d, Simulation } from "./gravity";
import { Vector2D } from "./vector2d";
import { CanvasClickAction, MouseBtnState } from "./types";
import { Canvas } from "./canvas";
import * as tsEssentials from "./essentials";
import { Sandbox } from "./sandbox";

let sandbox: Sandbox;
let selectedMassInput: number;
let canvasLeftMouseState: MouseBtnState = MouseBtnState.Up;
let lastMainMouseBtnDownPositionOnCanvas: Vector2D = new Vector2D (0, 0);
let selectedCanvasClickAction: string;
const canvasId: string = "theCanvas";

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    registerEvents();
    sandbox = new Sandbox(new Canvas(<HTMLCanvasElement>document.getElementById(canvasId)), new Simulation())
    sandbox.initStatusBar();
    sandbox.initSandbox({x: 1280, y: 720}, canvasId);
    selectedMassInput = tsEssentials.getInputNumber("massInput");
    (<HTMLInputElement>document.getElementById("massInput")!).step = calculateMassInputStep();
    selectedCanvasClickAction = (document.querySelector('input[name="radioBtnMouseAction"]:checked') as HTMLInputElement).value;
    (<HTMLInputElement>document.getElementById("cbxElasticCollisions")).disabled = !sandbox.simulation.collisionDetection;
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("btnToggleSim")?.addEventListener("click", toggleSimulationClicked);
    document.getElementById("btnNextStep")?.addEventListener("click", nextStepClicked);
    document.getElementById("btnResetSim")?.addEventListener("click", resetClicked);
    document.getElementById("btnZoomOut")?.addEventListener("click", zoomOutClicked);
    document.getElementById("btnZoomIn")?.addEventListener("click", zoomInClicked);
    document.getElementById("btnScrollLeft")?.addEventListener("click", scrollLeftClicked);
    document.getElementById("btnScrollRight")?.addEventListener("click", scrollRightClicked);
    document.getElementById("btnScrollUp")?.addEventListener("click", scrollUpClicked);
    document.getElementById("btnScrollDown")?.addEventListener("click", scrollDownClicked);
    document.getElementById(canvasId)?.addEventListener("mousedown", canvasMouseDown);
    document.getElementById(canvasId)?.addEventListener("mouseup", canvasMouseUp);
    document.getElementById(canvasId)?.addEventListener("mouseout", canvasMouseOut);
    document.getElementById(canvasId)?.addEventListener("mousemove", canvasMouseMove);
    document.getElementById(canvasId)?.addEventListener("touchstart", canvasTouchStart);
    document.getElementById(canvasId)?.addEventListener("touchend", canvasTouchEnd);
    document.getElementById(canvasId)?.addEventListener("touchmove", canvasTouchMove);
    document.getElementById("massInput")?.addEventListener("change", massInputChanged);
    document.getElementById("cbxDisplayVectors")?.addEventListener("change", cbxDisplayVectorsChanged);
    document.getElementById("cbxCollisions")?.addEventListener("change", cbxCollisionsChanged);
    document.getElementById("cbxElasticCollisions")?.addEventListener("change", cbxElasticCollisionsChanged);
    document.querySelectorAll('input[name="radioBtnMouseAction"]').forEach((radioButton) => {
        radioButton.addEventListener('change', radioBtnMouseActionChanged);
      });
}
//#region eventHandlers
function zoomOutClicked(this: HTMLElement, ev: MouseEvent) {
    const zoomCenter = new Vector2D(sandbox.canvas.visibleCanvas.width / 2, sandbox.canvas.visibleCanvas.height / 2)
    sandbox.zoomOut(zoomCenter);
}
function zoomInClicked(this: HTMLElement, ev: MouseEvent) {
    const zoomCenter = new Vector2D(sandbox.canvas.visibleCanvas.width / 2, sandbox.canvas.visibleCanvas.height / 2)
    sandbox.zoomIn(zoomCenter);
}
function scrollLeftClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasLeft();
}
function scrollRightClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasRight();
}
function scrollUpClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasUp();
}
function scrollDownClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasDown();
}
function massInputChanged(this: HTMLElement) {
    const element = this as HTMLInputElement;
    const inputValue = element.value;
    selectedMassInput = tsEssentials.isNumeric(inputValue) ? +inputValue : 0;
    element.step = calculateMassInputStep(); // step = 10% of input value, round down to nearest power of 10
}
function cbxCollisionsChanged(event: Event) {
    const checked = tsEssentials.isChecked(event.target as HTMLInputElement);
    const cbxElastic: HTMLInputElement = <HTMLInputElement>document.getElementById("cbxElasticCollisions");
    const elasticChecked = tsEssentials.isChecked(cbxElastic);
    sandbox.simulation.collisionDetection = checked;
    sandbox.simulation.elasticCollisions = elasticChecked;

    cbxElastic.disabled = !checked;
}
function cbxElasticCollisionsChanged(event: Event) {
    const checked = tsEssentials.isChecked(event.target as HTMLInputElement);
    sandbox.simulation.elasticCollisions = checked;
}
function cbxDisplayVectorsChanged(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    sandbox.animationSettings.displayVectors = checkbox ? checkbox.checked : false;
    if (!sandbox.animationRunning) {
        sandbox.canvas.redrawSimulationState(sandbox.simulation.simulationState, sandbox.animationSettings.displayVectors);
    }
}
function radioBtnMouseActionChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.type === 'radio') {
      selectedCanvasClickAction = target.value;
    }
}
function toggleSimulationClicked(this: HTMLElement, ev: MouseEvent) {
    if (sandbox.simulation.running) {
        sandbox.pauseSimulation();
        document.getElementById("btnToggleSim")!.innerHTML = "Play";
    } else {
        sandbox.resumeSimulation();
        document.getElementById("btnToggleSim")!.innerHTML = "Pause";
    }
}
function nextStepClicked() {
    if (sandbox.animationRunning) {
        return;
    }
    sandbox.simulation.nextState();
    sandbox.canvas.redrawSimulationState(sandbox.simulation.simulationState, sandbox.animationSettings.displayVectors);
    sandbox.setStatusMessage(`Simulation Tick: ${sandbox.simulation.tickCount}`, 2);
    sandbox.setStatusMessage(`Number of Bodies: ${sandbox.simulation.simulationState.length}`, 1);
}
function resetClicked() {
    if (sandbox.simulation.running) {
        sandbox.pauseSimulation();
        document.getElementById("btnToggleSim")!.innerHTML = "Play";
    }
    sandbox.simulation.clearObjects();
    sandbox.simulation.tickCount = 0;
    sandbox.canvas.redrawSimulationState(sandbox.simulation.simulationState, sandbox.animationSettings.displayVectors);
    sandbox.setStatusMessage(`Simulation Tick: ${sandbox.simulation.tickCount}`, 2);
    sandbox.setStatusMessage(`Number of Bodies: ${sandbox.simulation.simulationState.length}`, 1);
}
function canvasMouseDown(this: HTMLElement, ev: MouseEvent) {
    if (ev.button !== 0) {
        return; // do nothing if a button other than the main mouse button is clicked
    }
    canvasLeftMouseState = MouseBtnState.Down;
    const mousePosition: Vector2D = sandbox.canvas.getCanvasMousePosition(ev);
    
    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:  
            break;
        case CanvasClickAction.AddBody:
            lastMainMouseBtnDownPositionOnCanvas = mousePosition;
            break;
        default:
            break;
    }
}
function canvasMouseMove(this: HTMLElement, ev: MouseEvent) {
    if (canvasLeftMouseState === MouseBtnState.Up) {
        return;
    }
}
function canvasMouseUp(this: HTMLElement, ev: MouseEvent) {
    if (ev.button !== 0 || canvasLeftMouseState === MouseBtnState.Up) {
        return;
    }
    canvasLeftMouseState = MouseBtnState.Up;
    const mousePosition: Vector2D = sandbox.canvas.getCanvasMousePosition(ev);
    
    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const bodyBeingAdded: Body2d = body2dFromInputs();
            if (bodyBeingAdded.mass <= 0) { break; }
            const vel: Vector2D = sandbox.simulation.calculateVelocityBetweenPoints(sandbox.canvas.pointFromCanvasSpaceToSimulationSpace(lastMainMouseBtnDownPositionOnCanvas), sandbox.canvas.pointFromCanvasSpaceToSimulationSpace(mousePosition));
            sandbox.simulation.addObject(bodyBeingAdded, sandbox.canvas.pointFromCanvasSpaceToSimulationSpace(mousePosition), vel);
            sandbox.setStatusMessage(`Number of Bodies: ${sandbox.simulation.simulationState.length}`, 1);
            break;
        default:
            break;
    }
    if (!sandbox.animationRunning) {
        sandbox.canvas.redrawSimulationState(sandbox.simulation.simulationState, sandbox.animationSettings.displayVectors);
    }
}
function canvasMouseOut(this: HTMLElement, ev: MouseEvent) {
    canvasLeftMouseState = MouseBtnState.Up;
}
function canvasTouchStart(this: HTMLElement, ev: TouchEvent) {
    canvasLeftMouseState = MouseBtnState.Down;
    const touchPosition = sandbox.canvas.getCanvasTouchPosition(ev);

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            ev.preventDefault();
            lastMainMouseBtnDownPositionOnCanvas = touchPosition;
            break;
        default:
            break;
    }
}
function canvasTouchMove(this: HTMLElement, ev: TouchEvent) {
    const touchPosition = sandbox.canvas.getCanvasTouchEndPosition(ev);
    tsEssentials.log(touchPosition.toString())
    if (touchPosition.x > sandbox.canvas.visibleCanvas.width || touchPosition.y > sandbox.canvas.visibleCanvas.height) {
        canvasLeftMouseState = MouseBtnState.Up;
    }
}
function canvasTouchEnd(this: HTMLElement, ev: TouchEvent) {
    if (canvasLeftMouseState === MouseBtnState.Up) {
        return;
    }
    canvasLeftMouseState = MouseBtnState.Up;
    const touchPosition = sandbox.canvas.getCanvasTouchEndPosition(ev);

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const bodyBeingAdded = body2dFromInputs();    
            if (bodyBeingAdded.mass <= 0) { break; }
            const vel: Vector2D = sandbox.simulation.calculateVelocityBetweenPoints(sandbox.canvas.pointFromCanvasSpaceToSimulationSpace(lastMainMouseBtnDownPositionOnCanvas), sandbox.canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition));
            sandbox.simulation.addObject(bodyBeingAdded, sandbox.canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition), vel);
            sandbox.setStatusMessage(`Number of Bodies: ${sandbox.simulation.simulationState.length}`, 1);
            break;
        default:
            break;
    }
    if (!sandbox.animationRunning) {
        sandbox.canvas.redrawSimulationState(sandbox.simulation.simulationState, sandbox.animationSettings.displayVectors);
    }
}
//#endregion

/**
 * The step is equal to 10% of the input value, rounded down to the nearest power of 10.
 * @returns Step as a string. Step is always at least 1 or larger.
 */
function calculateMassInputStep(): string {
    let step = (10 ** (Math.floor(Math.log10(selectedMassInput)) - 1));
    return step < 1 ? "1" : step.toString();
}
function body2dFromInputs(): Body2d {
    const movable = tsEssentials.isChecked("cvsCbxBodyMovable");
    return new Body2d(selectedMassInput, movable);
}
