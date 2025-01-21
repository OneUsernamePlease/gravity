import { InferCustomEventPayload } from "vite";
import { Body2d, Simulation } from "./gravity";
import { Vector2D } from "./vector2d";
import { CanvasClickAction, MouseBtnState } from "./types";
import { Canvas } from "./canvas";
import * as tsEssentials from "./essentials";

let canvas: Canvas;
let simulation: Simulation;
let statusBar: { fields: HTMLElement[] } = { fields: [] };
let selectedMassInput: number;
let canvasLeftMouseState: MouseBtnState = MouseBtnState.Up;
let lastMainMouseBtnDownPositionOnCanvas: Vector2D = new Vector2D (0, 0);
let selectedCanvasClickAction: string;

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    initStatusBar();
    registerEvents();
    initCanvas(1280, 720);
    initSimulation();
    selectedMassInput = tsEssentials.getInputNumber("massInput");
    (<HTMLInputElement>document.getElementById("massInput")!).step = calculateMassInputStep();
    selectedCanvasClickAction = (document.querySelector('input[name="radioBtnMouseAction"]:checked') as HTMLInputElement).value;
    (<HTMLInputElement>document.getElementById("cbxElasticCollisions")).disabled = !simulation.collisionDetection;
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
    document.getElementById("theCanvas")?.addEventListener("mousedown", canvasMouseDown);
    document.getElementById("theCanvas")?.addEventListener("mouseup", canvasMouseUp);
    document.getElementById("theCanvas")?.addEventListener("mouseout", canvasMouseOut);
    document.getElementById("theCanvas")?.addEventListener("mousemove", canvasMouseMove);
    document.getElementById("theCanvas")?.addEventListener("touchstart", canvasTouchStart);
    document.getElementById("theCanvas")?.addEventListener("touchend", canvasTouchEnd);
    document.getElementById("theCanvas")?.addEventListener("touchmove", canvasTouchMove);
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
    canvas.zoomOut(new Vector2D(canvas.visibleCanvas.width / 2, canvas.visibleCanvas.height / 2));
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
    setStatusMessage(`Zoom: ${canvas.canvasSpace.zoomFactor} (m per pixel)`, 4);
}
function zoomInClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.zoomIn(new Vector2D(canvas.visibleCanvas.width / 2, canvas.visibleCanvas.height / 2));
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
    setStatusMessage(`Zoom: ${canvas.canvasSpace.zoomFactor} (m per pixel)`, 4);
}
function scrollLeftClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.moveCanvasLeft();
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
}
function scrollRightClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.moveCanvasRight();
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
}
function scrollUpClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.moveCanvasUp();
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
}
function scrollDownClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.moveCanvasDown();
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
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
    simulation.collisionDetection = checked;
    simulation.elasticCollisions = elasticChecked;

    cbxElastic.disabled = !checked;
}
function cbxElasticCollisionsChanged(event: Event) {
    const checked = tsEssentials.isChecked(event.target as HTMLInputElement);
    simulation.elasticCollisions = checked;
}
function cbxDisplayVectorsChanged(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    canvas.animationSettings.displayVectors = checkbox ? checkbox.checked : false;
    if (!canvas.animationRunning) {
        canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
    }
}
function radioBtnMouseActionChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.type === 'radio') {
      selectedCanvasClickAction = target.value;
    }
}
function toggleSimulationClicked(this: HTMLElement, ev: MouseEvent) {
    if (simulation.running) {
        pauseSimulation();
    } else {
        resumeSimulation();
    }
}
function nextStepClicked() {
    if (canvas.animationRunning) {
        return;
    }
    simulation.nextState();
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
    setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
    setStatusMessage(`Number of Bodies: ${simulation.simulationState.length}`, 1);
}
function resetClicked() {
    if (simulation.running) {
        pauseSimulation();
    }
    simulation.clearObjects();
    simulation.tickCount = 0;
    canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
    setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
    setStatusMessage(`Number of Bodies: ${simulation.simulationState.length}`, 1);
}
function canvasMouseDown(this: HTMLElement, ev: MouseEvent) {
    if (ev.button !== 0) {
        return; // do nothing if a button other than the main mouse button is clicked
    }
    canvasLeftMouseState = MouseBtnState.Down;
    const mousePosition: Vector2D = canvas.getCanvasMousePosition(ev);
    
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
    const mousePosition: Vector2D = canvas.getCanvasMousePosition(ev);
    
    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const bodyBeingAdded: Body2d = body2dFromInputs();
            if (bodyBeingAdded.mass <= 0) { break; }
            const vel: Vector2D = calculateVelocityBetweenPoints(canvas.pointFromCanvasSpaceToSimulationSpace(lastMainMouseBtnDownPositionOnCanvas), canvas.pointFromCanvasSpaceToSimulationSpace(mousePosition));
            addBodyToSimulation(bodyBeingAdded, canvas.pointFromCanvasSpaceToSimulationSpace(mousePosition), vel);
            setStatusMessage(`Number of Bodies: ${simulation.simulationState.length}`, 1);
            break;
        default:
            break;
    }
    if (!canvas.animationRunning) {
        canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
    }
}
function canvasMouseOut(this: HTMLElement, ev: MouseEvent) {
    canvasLeftMouseState = MouseBtnState.Up;
}
function canvasTouchStart(this: HTMLElement, ev: TouchEvent) {
    canvasLeftMouseState = MouseBtnState.Down;
    const touchPosition = canvas.getCanvasTouchPosition(ev);

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
    const touchPosition = canvas.getCanvasTouchEndPosition(ev);
    tsEssentials.log(touchPosition.toString())
    if (touchPosition.x > canvas.visibleCanvas.width || touchPosition.y > canvas.visibleCanvas.height) {
        canvasLeftMouseState = MouseBtnState.Up;
    }
}
function canvasTouchEnd(this: HTMLElement, ev: TouchEvent) {
    if (canvasLeftMouseState === MouseBtnState.Up) {
        return;
    }
    canvasLeftMouseState = MouseBtnState.Up;
    const touchPosition = canvas.getCanvasTouchEndPosition(ev);

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const bodyBeingAdded = body2dFromInputs();    
            if (bodyBeingAdded.mass <= 0) { break; }
            const vel: Vector2D = calculateVelocityBetweenPoints(canvas.pointFromCanvasSpaceToSimulationSpace(lastMainMouseBtnDownPositionOnCanvas), canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition));
            addBodyToSimulation(bodyBeingAdded, canvas.pointFromCanvasSpaceToSimulationSpace(touchPosition), vel);
            setStatusMessage(`Number of Bodies: ${simulation.simulationState.length}`, 1);
            break;
        default:
            break;
    }
    if (!canvas.animationRunning) {
        canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
    }
}
//#endregion
function initSimulation() {
    simulation = new Simulation();
    simulation.collisionDetection = tsEssentials.isChecked("cbxCollisions");
    simulation.elasticCollisions = tsEssentials.isChecked("cbxElasticCollisions");
}
function initStatusBar() {
    const idBeginsWith = "statusText";
    let i = 1;
    let statusBarField = document.getElementById(idBeginsWith + i);
    while (statusBarField !== null) {
        statusBar.fields.push(statusBarField)
        i++;
        statusBarField = document.getElementById(idBeginsWith + i);
    }
}
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
/**
 * @param fieldIndexOrId number of field, starting at one. OR id of the field
 */
function setStatusMessage(newMessage: string, fieldIndexOrId?: number | string, append: boolean = false) {
    let element: HTMLElement;
    if (typeof fieldIndexOrId === "number") {
        element = statusBar.fields[fieldIndexOrId - 1];
    } else if (typeof fieldIndexOrId === "string") {
        element = document.getElementById(fieldIndexOrId)!;
    } else {
        element = statusBar.fields[0];
    }
    
    if (append) {
        element!.innerHTML += newMessage;
    } else {
        element!.innerHTML = newMessage;
    }
}
function initCanvas(width: number, height: number) {
    const visibleCanvas = (document.getElementById("theCanvas")) as HTMLCanvasElement;
    canvas = new Canvas(visibleCanvas);
    canvas.visibleCanvas.width = width;
    canvas.visibleCanvas.height = height;
    canvas.animationSettings.displayVectors = tsEssentials.isChecked("cbxDisplayVectors");
    setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
    // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
    // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
}
// #region simulation
/**
 * Calculates and returns the velocity vector needed to get from *fromCoordinate* to *toCoordinate* in *timeFrameInSeconds* seconds
 * @param toCoordinate value in simulation space
 * @param fromCoordinate value in simulation space
 * @param timeFrameInSeconds *optional* defaults to one
 */
function calculateVelocityBetweenPoints(toCoordinate: Vector2D, fromCoordinate: Vector2D, timeFrameInSeconds: number = 1): Vector2D {
    if (timeFrameInSeconds <= 0) { timeFrameInSeconds = 1; }
    let distance: Vector2D = toCoordinate.subtract(fromCoordinate);
    return distance.scale(1 / timeFrameInSeconds);
}
/**
 * @param position in *SIMULATION SPACE*
 * @param velocity in *SIMULATION SPACE*
 */
function addBodyToSimulation(body: Body2d, position?: Vector2D, velocity?: Vector2D, movable?: boolean) {
    if (position === undefined) {
        position = new Vector2D(0, 0);
    }
    if (velocity === undefined) {
        velocity = new Vector2D(0, 0);
    }
    if (movable !== undefined) {
        body.movable = movable;
    }
    const objectState = {body: body, position: position, velocity: velocity, acceleration: new Vector2D(0, 0)};

    simulation.addObject(objectState);
}
function resumeSimulation() {
    if (!simulation.running) {
        simulation.run();
        drawRunningSimulation();
        setStatusMessage(`Number of Bodies: ${simulation.simulationState.length}`, 1);
        document.getElementById("btnToggleSim")!.innerHTML = "Pause";
    }
}
function pauseSimulation() {
    if (simulation.running) {
        canvas.animationRunning = false;
        simulation.pause();
        document.getElementById("btnToggleSim")!.innerHTML = "Play";
    }
}
function drawRunningSimulation() {
    if (canvas.animationRunning) {
        return;
    }
    canvas.animationRunning = true;
    const runDrawLoop = () => {
        if (canvas.animationRunning) {
            setTimeout(runDrawLoop, canvas.animationSettings.frameLength);
            canvas.redrawSimulationState(simulation.simulationState, canvas.animationSettings.displayVectors);
            setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
            setStatusMessage(`Number of Bodies: ${simulation.simulationState.length}`, 1);
        }
    };
    runDrawLoop();
}
// #endregion
