import { InferCustomEventPayload } from "vite";
import { Body2d, Simulation } from "./gravity";
import { Vector2D } from "tcellib-vectors";
import * as tsEssentials from "./essentials";

interface CanvasSpace { 
    // use this to transform simulationSpace to canvasSpace and back
    origin: Vector2D, // the canvas' origin in simulation space
    zoomFactor: number, // simulationUnits (meter) per canvasUnit
    orientationY: number; // in practice this is -1, as the y-axis of the canvas is in the opposite direction of the simulation
}
enum CanvasClickAction {
    None = 0,
    AddBody = 1,
    ScrollCanvas = 2,
}
enum MouseBtnState {
    Up = 0,
    Down = 1,
}

// let offscreenCanvas: OffscreenCanvas; // use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas: HTMLCanvasElement;
// let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D;
let visibleCanvasContext: CanvasRenderingContext2D;
let statusBar: { fields: HTMLElement[] } = { fields: [] };
let simulation: Simulation;
let canvasSpace: CanvasSpace;
let frameLength = 25; // ms
let animationRunning = false; // set to true while the sim is running
let zoomStep = 1; // simUnits that get added to or subtracted from one canvasUnit in a zoom steps

// when scrolling, canvas is moved by this percentage of its height/width in the corresponding direction
let defaultScrollRate = 0.1;

let selectedMassInput: number;
let tracePaths = false;
let displayVectors: boolean;
let canvasLMouseState: MouseBtnState = MouseBtnState.Up;
let mainMouseBtnLastCanvasPosition: Vector2D = new Vector2D (0, 0); // the position on the canvas, where the mouse's main button's last down-event happened
let selectedCanvasClickAction: string;
// #region page stuff
document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    initStatusBar();
    registerEvents();
    initCanvas(1280, 720);
    canvasSpace = {origin: {x: 0, y: 0}, zoomFactor: 1, orientationY: -1};
    simulation = new Simulation();
    displayVectors = tsEssentials.isChecked("cbxDisplayVectors");
    selectedMassInput = tsEssentials.getInputNumber("massInput");
    (<HTMLInputElement>document.getElementById("massInput")!).step = calculateMassInputStep();
    selectedCanvasClickAction = (document.querySelector('input[name="cvsRadioBtnMouseAction"]:checked') as HTMLInputElement).value;
    simulation.collisionDetection = tsEssentials.isChecked("cbxCollisions");
    simulation.elasticCollisions = tsEssentials.isChecked("cbxElasticCollisions");
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("cvsBtnToggleSim")?.addEventListener("click", toggleSimulation);
    document.getElementById("cvsBtnNextStep")?.addEventListener("click", advanceSimulationState);
    document.getElementById("cvsBtnResetSim")?.addEventListener("click", resetSimulation);
    document.getElementById("cvsBtnZoomOut")?.addEventListener("click", zoomOut);
    document.getElementById("cvsBtnZoomIn")?.addEventListener("click", zoomIn);
    document.getElementById("cvsBtnScrollLeft")?.addEventListener("click", scrollLeft);
    document.getElementById("cvsBtnScrollRight")?.addEventListener("click", scrollRight);
    document.getElementById("cvsBtnScrollUp")?.addEventListener("click", scrollUp);
    document.getElementById("cvsBtnScrollDown")?.addEventListener("click", scrollDown);
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
    displayVectors = checkbox ? checkbox.checked : false;
    if (!animationRunning) {
        redrawSimulationState();
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
    const touchPosition = getCanvasTouchPosition(ev);

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            console.log(touchPosition.toString());
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
    const touchPosition = getCanvasTouchEndPosition(ev);

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const body: Body2d = body2dFromInputs();
            if (body.mass <= 0) { break; }
            const vel: Vector2D = calculateVelocityBetweenPoints(pointInCanvasSpaceToSimulationSpace(mainMouseBtnLastCanvasPosition), pointInCanvasSpaceToSimulationSpace(touchPosition));
            addBodyToSimulation(body, pointInCanvasSpaceToSimulationSpace(touchPosition), vel);
            setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
            break;
        default:
            break;
    }
    if (!animationRunning) {
        redrawSimulationState();
    }
}
function cvsMouseDownHandler(this: HTMLElement, ev: MouseEvent) {
    if (ev.button !== 0) {
        return; // do nothing if a button other than the main mouse button is clicked
    }
    canvasLMouseState = MouseBtnState.Down;
    const mousePosition: Vector2D = getCanvasMousePosition(ev);
    log("canvasMouseDownHandler:" + MouseBtnState[canvasLMouseState] + " - at Position: " + mousePosition.toString());

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
    const mousePosition: Vector2D = getCanvasMousePosition(ev);
    log("canvasMouseUpHandler:" + MouseBtnState[canvasLMouseState] + " - at Position: " + mousePosition.toString());

    switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:
            break;
        case CanvasClickAction.AddBody:
            const body: Body2d = body2dFromInputs();
            if (body.mass <= 0) { break; }
            const vel: Vector2D = calculateVelocityBetweenPoints(pointInCanvasSpaceToSimulationSpace(mainMouseBtnLastCanvasPosition), pointInCanvasSpaceToSimulationSpace(mousePosition));
            addBodyToSimulation(body, pointInCanvasSpaceToSimulationSpace(mousePosition), vel);
            setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
            break;
        default:
            break;
    }
    if (!animationRunning) {
        redrawSimulationState();
    }
}
function cvsMouseMoveHandler(this: HTMLElement, ev: MouseEvent) {
    const mousePosition: Vector2D = getCanvasMousePosition(ev);
    log("canvasMouseMoveHandler:" + MouseBtnState[canvasLMouseState] + " - at Position: " + mousePosition.toString());
    if (canvasLMouseState === MouseBtnState.Up) {
        return;
    }
    // goal: display vector for a body that is currently being added
    // or add body to simSpace as immovable, with the velocity from moving, then redraw everything
}
function cvsMouseOutHandler(this: HTMLElement, ev: MouseEvent) {
    canvasLMouseState = MouseBtnState.Up;
    // cancel an ongoing addBodyToSimulation
    // ...
    // redraw simState to get rid of the adding's velocity-vector
}
function getCanvasMousePosition(event: MouseEvent): Vector2D {
    const rect = visibleCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return new Vector2D(x, y);
}
function getCanvasTouchPosition(event: TouchEvent): Vector2D {
    const rect = visibleCanvas.getBoundingClientRect();
    const touch = event.touches[0];
    return new Vector2D(touch.clientX - rect.left, touch.clientY - rect.top)
}
function getCanvasTouchEndPosition(event: TouchEvent): Vector2D {
    const rect = visibleCanvas.getBoundingClientRect();
    const touch = event.changedTouches[0];
    return new Vector2D(touch.clientX - rect.left, touch.clientY - rect.top)
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
    visibleCanvas = (document.getElementById("theCanvas")) as HTMLCanvasElement;
    visibleCanvas.width = width;
    visibleCanvas.height = height;
    visibleCanvasContext = visibleCanvas.getContext("2d")!;
    setStatusMessage(`Canvas dimension: ${width} * ${height}`, 5);
    // offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
    // offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
}
function log(message: string) {
    const timestamp = new Date();
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');

    const formattedTimestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    console.log(`[${formattedTimestamp}] ${message}`);
}
// #endregion
// #region canvas and drawing stuff
/**
 * @param position in canvas space
 * @param direction in canvas space
 */
function drawVector(position: Vector2D, direction: Vector2D, color?: string) {
    // optionally normalize the direction and scale later
    if (color === undefined) { color = "white" }
    let endPosition: Vector2D = Vector2D.add(position, direction);
    visibleCanvasContext.beginPath();
    visibleCanvasContext.lineWidth = 3;
    visibleCanvasContext.strokeStyle = color;
    visibleCanvasContext.moveTo(position.x, position.y);
    visibleCanvasContext.lineTo(endPosition.x, endPosition.y);
    visibleCanvasContext.stroke();
}
/**
 * draws a circular body at specified position, in specified color
 * @param body 
 * @param position 
 * @param color default white
 */
function drawBody(body: Body2d, position: Vector2D) {
    let visibleRadius = Math.max(body.radius / canvasSpace.zoomFactor, 1); // Minimum Radius of displayed body is one
    visibleCanvasContext.beginPath();
    visibleCanvasContext.arc(position.x, position.y, visibleRadius, 0, Math.PI * 2); // zF = m/cu; r...m -> r/zF -> (m)/
    visibleCanvasContext.closePath();
    visibleCanvasContext.fillStyle = body.color;
    visibleCanvasContext.fill();
}
function drawBodies() {
    const objects = simulation.objectStates;
    objects.forEach(object => {
        if (object !== null) {
            drawBody(object.body, pointInSimulationSpaceToCanvasSpace(object.position));
        }
    });
}
function redrawSimulationState() {
    visibleCanvasContext.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
    drawBodies();
    if (displayVectors) {
        drawVectors();
    }
}
function drawVectors() {
    simulation.objectStates.forEach(objectState => {
        drawVector(pointInSimulationSpaceToCanvasSpace(objectState.position), directionInSimulationSpaceToCanvasSpace(objectState.acceleration), "green");
        drawVector(pointInSimulationSpaceToCanvasSpace(objectState.position), directionInSimulationSpaceToCanvasSpace(objectState.velocity), "red");
    });
}
function pointInSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
    // transformation:
    // 1. shift (point in SimSpace - Origin of C in SimSpace)
    // 2. flip (y axis point in opposite directions)
    // 3. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const shifted: Vector2D = Vector2D.subtract(simVector, canvasSpace.origin);
    const flipped: Vector2D = {x: shifted.x, y: shifted.y * -1}
    const scaled: Vector2D = Vector2D.scale(flipped, 1/canvasSpace.zoomFactor);
    return scaled;
}
function directionInSimulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
    // transformation:
    // 1. flip (y axis are in opposite directions)
    // 2. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const flipped: Vector2D = {x: simVector.x, y: simVector.y * -1}
    const scaled: Vector2D = Vector2D.scale(flipped, 1/canvasSpace.zoomFactor);
    return scaled;
}
function pointInCanvasSpaceToSimulationSpace(canvasVector: Vector2D): Vector2D {
    // transformation:
    // 1. scale (canvasVector * zoom in simulationUnits/canvasUnit)
    // 2. flip (y axis are in opposite directions)
    // 3. shift (scaledAndFlippedPoint + Origin of C in SimSpace)
    let simulationVector: Vector2D;
    simulationVector = Vector2D.add(Vector2D.hadamardProduct(Vector2D.scale(canvasVector, canvasSpace.zoomFactor), {x: 1, y: canvasSpace.orientationY}), canvasSpace.origin)
    return simulationVector;
}
/**
 * Origin {x:0,y:0} is at the top-left
 */
function setCanvasOrigin(newOrigin: Vector2D) {
    canvasSpace.origin = newOrigin;
    if (!animationRunning) {
        redrawSimulationState();
    }
}
function scrollRight() {
    let scrollDistance = calculateScrollDistance("horizontal"); // in simulationUnits
    setCanvasOrigin({x: canvasSpace.origin.x + scrollDistance, y: canvasSpace.origin.y });
}
function scrollLeft() {
    let scrollDistance = calculateScrollDistance("horizontal"); // in simulationUnits
    setCanvasOrigin({x: canvasSpace.origin.x - scrollDistance, y: canvasSpace.origin.y });
}
function scrollUp() {
    let scrollDistance = calculateScrollDistance("vertical"); // in simulationUnits
    setCanvasOrigin({x: canvasSpace.origin.x, y: canvasSpace.origin.y + scrollDistance });
}
function scrollDown() {
    let scrollDistance = calculateScrollDistance("vertical"); // in simulationUnits
    setCanvasOrigin({x: canvasSpace.origin.x, y: canvasSpace.origin.y - scrollDistance });
}
/**
 * 
 * @param orientation "horizontal" | "vertical"
 * @param rate a number *0<rate<1* - the relative distance of the screen dimension (h/v) that one scroll step will move (ie. 0.1 will scroll 10% of the width/height in a horizontal/vertical direction)
 * @returns 
 */
function calculateScrollDistance(orientation: "horizontal" | "vertical", rate?: number): number {
    if (rate === undefined) { rate = defaultScrollRate; }
    switch (orientation) {
        case "horizontal":
            return visibleCanvas.width * rate * canvasSpace.zoomFactor;
        case "vertical":
            return visibleCanvas.height * rate * canvasSpace.zoomFactor;
    }
}
function zoomOut() {
    const zoomCenter: Vector2D = {x: visibleCanvas.width/2, y: visibleCanvas.height/2};
    const newZoom = canvasSpace.zoomFactor + zoomStep;

    let shiftOrigin: Vector2D = Vector2D.scale(zoomCenter, zoomStep); // zoom step here is really the difference in zoom change (zoomFactor now - zoomFactor before)

    canvasSpace.origin = {x: canvasSpace.origin.x - shiftOrigin.x, y: canvasSpace.origin.y + shiftOrigin.y};
    canvasSpace.zoomFactor = newZoom;

    setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);
    if (!animationRunning) {
        redrawSimulationState();
    }
}
function zoomIn() {
    if (canvasSpace.zoomFactor <= 1) { return; }
    let zoomCenter: Vector2D = {x: visibleCanvas.width/2, y: visibleCanvas.height/2};
    let newZoom = canvasSpace.zoomFactor - zoomStep;

    let shiftOrigin: Vector2D = Vector2D.scale(zoomCenter, zoomStep); // zoom step here is really the difference in zoom change (zoomFactor now - zoomFactor before)

    canvasSpace.origin = {x: canvasSpace.origin.x + shiftOrigin.x, y: canvasSpace.origin.y - shiftOrigin.y};
    canvasSpace.zoomFactor = newZoom;
    
    setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);
    if (!animationRunning) {
        redrawSimulationState();
    }
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
    let distance: Vector2D = Vector2D.subtract(toCoordinate, fromCoordinate);
    return Vector2D.scale(distance, 1 / timeFrameInSeconds);
}
function toggleSimulation(this: HTMLElement, ev: MouseEvent) {
    if (simulation.running) {
        pauseSimulation();
    } else {
        resumeSimulation();
    }
}
function advanceSimulationState() {
    if (animationRunning) {
        return;
    }
    simulation.nextState();
    redrawSimulationState();
    setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
    setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
}
function resetSimulation() {
    if (simulation.running) {
        pauseSimulation();
    }
    simulation.clearObjects();
    simulation.tickCount = 0;
    redrawSimulationState();
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
        position = {x: 0, y: 0};
    }
    if (velocity === undefined) {
        velocity = {x: 0, y: 0};
    }
    if (movable !== undefined) {
        body.movable = movable;
    }
    const objectState = {body: body, position: position, velocity: velocity, acceleration: {x: 0, y: 0}};

    simulation.addObject(objectState);
}
function resumeSimulation() {
    if (!simulation.running) {
        simulation.run();
        drawRunningSimulation();
        setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
        document.getElementById("cvsBtnToggleSim")!.innerHTML = "Pause";
    }
}
function pauseSimulation() {
    if (simulation.running) {
        animationRunning = false;
        simulation.pause();
        document.getElementById("cvsBtnToggleSim")!.innerHTML = "Play";
    }
}
function drawRunningSimulation() {
    if (animationRunning) {
        return;
    }
    animationRunning = true;
    const runDrawLoop = () => {
        if (animationRunning) {
            setTimeout(runDrawLoop, frameLength);
            redrawSimulationState();
            setStatusMessage(`Simulation Tick: ${simulation.tickCount}`, 2);
            setStatusMessage(`Number of Bodies: ${simulation.objectStates.length}`, 1);
            // log("Draw simulation step");
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
        body1 = new Body2d(rng(20, 200));    
    } else if (radius === undefined) {
        body1 = new Body2d(mass);
    } else {
        body1 = new Body2d(mass, true, "white", radius);
    }
    return body1;
}
// #endregion
// #region other stuff
/**
 * min and max included
 * @returns random number
 */
function rng(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// #endregion
