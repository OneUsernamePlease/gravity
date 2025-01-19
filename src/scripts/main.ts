import { InferCustomEventPayload } from "vite";
import { Body2d, Simulation } from "./gravity";
import { Vector2D } from "./vector2d";
import { CanvasClickAction, CanvasSpace, MouseBtnState } from "./types";
import { Canvas } from "./canvas";
import * as tsEssentials from "./essentials";

let canvas: Canvas;
let statusBar: { fields: HTMLElement[] } = { fields: [] };
let simulation: Simulation;
//let animationRunning = false; // set to true while the sim is running

let selectedMassInput: number;
let canvasLMouseState: MouseBtnState = MouseBtnState.Up;
let mainMouseBtnLastCanvasPosition: Vector2D = new Vector2D (0, 0); // the position on the canvas, where the mouse's main button's last down-event happened
let selectedCanvasClickAction: string;
// #region page stuff
document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    initStatusBar();
    registerEvents();
    initCanvas(1280, 720);
    simulation = new Simulation();
    canvas.animationSettings.displayVectors = tsEssentials.isChecked("cbxDisplayVectors");
    selectedMassInput = tsEssentials.getInputNumber("massInput");
    (<HTMLInputElement>document.getElementById("massInput")!).step = calculateMassInputStep();
    selectedCanvasClickAction = (document.querySelector('input[name="cvsRadioBtnMouseAction"]:checked') as HTMLInputElement).value;
    simulation.collisionDetection = tsEssentials.isChecked("cbxCollisions");
    simulation.elasticCollisions = tsEssentials.isChecked("cbxElasticCollisions");
    (<HTMLInputElement>document.getElementById("cbxElasticCollisions")).disabled = !simulation.collisionDetection;
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("btnToggleSim")?.addEventListener("click", toggleSimulation);
    document.getElementById("cvsBtnNextStep")?.addEventListener("click", advanceSimulationState);
    document.getElementById("cvsBtnResetSim")?.addEventListener("click", resetSimulation);
    document.getElementById("btnZoomOut")?.addEventListener("click", zoomOutClicked); // !!!
    document.getElementById("cvsBtnZoomIn")?.addEventListener("click", zoomInClicked); // !!!
    document.getElementById("cvsBtnScrollLeft")?.addEventListener("click", scrollLeftClicked); // !!!
    document.getElementById("cvsBtnScrollRight")?.addEventListener("click", scrollRightClicked); // !!!
    document.getElementById("cvsBtnScrollUp")?.addEventListener("click", scrollUpClicked); // !!!
    document.getElementById("cvsBtnScrollDown")?.addEventListener("click", scrollDownClicked); // !!!
    document.getElementById("theCanvas")?.addEventListener("mousedown", cvsMouseDownHandler);
    document.getElementById("theCanvas")?.addEventListener("mouseup", cvsMouseUpHandler);
    document.getElementById("theCanvas")?.addEventListener("mouseout", cvsMouseOutHandler);
    document.getElementById("theCanvas")?.addEventListener("mousemove", cvsMouseMoveHandler);
    document.getElementById("theCanvas")?.addEventListener("touchstart", cvsTouchStartHandler);
    document.getElementById("theCanvas")?.addEventListener("touchend", cvsTouchEndHandler);
    document.getElementById("massInput")?.addEventListener("change", massInputChangeHandler);
    document.getElementById("cbxDisplayVectors")?.addEventListener("change", cbxDisplayVectorsChangeHandler);
    document.getElementById("cbxCollisions")?.addEventListener("change", cbxCollisionsChangeHandler);
    document.getElementById("cbxElasticCollisions")?.addEventListener("change", cbxElasticCollisionsChangeHandler);
    document.querySelectorAll('input[name="cvsRadioBtnMouseAction"]').forEach((radioButton) => {
        radioButton.addEventListener('change', radioBtnMouseActionChangeHandler);
      });
}
function zoomOutClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.zoomOut();
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
    setStatusMessage(`Zoom: ${canvas.canvasSpace.zoomFactor} (m per pixel)`, 4);
}
function zoomInClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.zoomIn();
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
    setStatusMessage(`Zoom: ${canvas.canvasSpace.zoomFactor} (m per pixel)`, 4);
}
function scrollLeftClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.scrollLeft();
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
}
function scrollRightClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.scrollRight();
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
}
function scrollUpClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.scrollUp();
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
}
function scrollDownClicked(this: HTMLElement, ev: MouseEvent) {
    canvas.scrollDown();
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
}
function massInputChangeHandler(this: HTMLElement) {
    const element = this as HTMLInputElement;
    const inputValue = element.value;
    selectedMassInput = tsEssentials.isNumeric(inputValue) ? +inputValue : 0;
    element.step = calculateMassInputStep(); // step = 10% of input value, round down to nearest power of 10
}
function cbxCollisionsChangeHandler(event: Event) {
    const checked = tsEssentials.isChecked(event.target as HTMLInputElement);
    const cbxElastic: HTMLInputElement = <HTMLInputElement>document.getElementById("cbxElasticCollisions");
    const elasticChecked = tsEssentials.isChecked(cbxElastic);
    simulation.collisionDetection = checked;
    simulation.elasticCollisions = elasticChecked;

    cbxElastic.disabled = !checked;
}
function cbxElasticCollisionsChangeHandler(event: Event) {
    const checked = tsEssentials.isChecked(event.target as HTMLInputElement);
    simulation.elasticCollisions = checked;
}
function cbxDisplayVectorsChangeHandler(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    canvas.animationSettings.displayVectors = checkbox ? checkbox.checked : false;
    if (!canvas.animationRunning) {
        canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
    }
}
function radioBtnMouseActionChangeHandler(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.type === 'radio') {
      selectedCanvasClickAction = target.value;
    }
}
function cvsTouchStartHandler(this: HTMLElement, ev: TouchEvent) {
    canvasLMouseState = MouseBtnState.Down;
    const touchPosition = canvas.getCanvasTouchPosition(ev);

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            ev.preventDefault();
            mainMouseBtnLastCanvasPosition = touchPosition;
            break;
        default:
            break;
    }
}
function cvsTouchEndHandler(this: HTMLElement, ev: TouchEvent) {
    canvasLMouseState = MouseBtnState.Up;
    const touchPosition = canvas.getCanvasTouchEndPosition(ev);

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const body: Body2d = body2dFromInputs();
            if (body.mass <= 0) { break; }
            const vel: Vector2D = calculateVelocityBetweenPoints(canvas.pointInCanvasSpaceToSimulationSpace(mainMouseBtnLastCanvasPosition), canvas.pointInCanvasSpaceToSimulationSpace(touchPosition));
            addBodyToSimulation(body, canvas.pointInCanvasSpaceToSimulationSpace(touchPosition), vel);
            setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
            break;
        default:
            break;
    }
    if (!canvas.animationRunning) {
        canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
    }
}
function cvsMouseDownHandler(this: HTMLElement, ev: MouseEvent) {
    if (ev.button !== 0) {
        return; // do nothing if a button other than the main mouse button is clicked
    }
    canvasLMouseState = MouseBtnState.Down;
    const mousePosition: Vector2D = canvas.getCanvasMousePosition(ev);
    
    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:  
            break;
        case CanvasClickAction.AddBody:
            mainMouseBtnLastCanvasPosition = mousePosition;
            break;
        default:
            break;
    }
}
function cvsMouseUpHandler(this: HTMLElement, ev: MouseEvent) {
    if (ev.button !== 0 || canvasLMouseState === MouseBtnState.Up) {
        return; // only the main mouse button matters, and only if the click was initiated inside the canvas
    }
    canvasLMouseState = MouseBtnState.Up;
    const mousePosition: Vector2D = canvas.getCanvasMousePosition(ev);
    
    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const body: Body2d = body2dFromInputs();
            if (body.mass <= 0) { break; }
            const vel: Vector2D = calculateVelocityBetweenPoints(canvas.pointInCanvasSpaceToSimulationSpace(mainMouseBtnLastCanvasPosition), canvas.pointInCanvasSpaceToSimulationSpace(mousePosition));
            addBodyToSimulation(body, canvas.pointInCanvasSpaceToSimulationSpace(mousePosition), vel);
            setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
            break;
        default:
            break;
    }
    if (!canvas.animationRunning) {
        canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
    }
}
function cvsMouseMoveHandler(this: HTMLElement, ev: MouseEvent) {
    if (canvasLMouseState === MouseBtnState.Up) {
        return;
    }
    // goal: display vector for a body that is currently being added
    // or add body to simSpace as immovable, with the velocity from moving, then redraw everything
}
function cvsMouseOutHandler(this: HTMLElement, ev: MouseEvent) {
    canvasLMouseState = MouseBtnState.Up;
}
/**
 * The step is equal to 10% of the input value, rounded down to the nearest power of 10.
 * @returns Step as a string. Step is always at least 1 or larger.
 */
function calculateMassInputStep(): string {
    let step = (10 ** (Math.floor(Math.log10(selectedMassInput)) - 1));
    return step < 1 ? "1" : step.toString();
}
function initStatusBar() {
    statusBar.fields;
    const idBeginsWith = "statusText";
    let i = 1;
    let statusBarField = document.getElementById(idBeginsWith + i);
    while (statusBarField !== null) {
        statusBar.fields.push(statusBarField)
        i++;
        statusBarField = document.getElementById(idBeginsWith + i);
    }
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
    setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
    // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
    // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
}
// #endregion

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
function toggleSimulation(this: HTMLElement, ev: MouseEvent) {
    if (simulation.running) {
        pauseSimulation();
    } else {
        resumeSimulation();
    }
}
function advanceSimulationState() {
    if (canvas.animationRunning) {
        return;
    }
    simulation.nextState();
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
    setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
    setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
}
function resetSimulation() {
    if (simulation.running) {
        pauseSimulation();
    }
    simulation.clearObjects();
    simulation.tickCount = 0;
    canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
    setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
    setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
}
/**
 * @param body 
 * @param position in **SIMULATION SPACE**
 * @param velocity in **SIMULATION SPACE**
 * @param movable 
 */
function addBodyToSimulation(body?: Body2d, position?: Vector2D, velocity?: Vector2D, movable?: boolean) {
    if (body === undefined) {
        body = newBody();
    }
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
        setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
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
            canvas.redrawSimulationState(simulation.objectStates, canvas.animationSettings.displayVectors);
            setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
            setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
        }
    };
    runDrawLoop();
}
function newBody(): Body2d 
function newBody(mass: number, radius: number): Body2d 
function newBody(mass: number, radius?: number): Body2d 
function newBody(mass?: number, radius?: number): Body2d {
    let body1: Body2d;
    if (mass === undefined) {
        body1 = new Body2d(tsEssentials.rng(20, 200));    
    } else if (radius === undefined) {
        body1 = new Body2d(mass);
    } else {
        body1 = new Body2d(mass, true, "white", radius);
    }
    return body1;
}
// #endregion
