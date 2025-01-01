import { InferCustomEventPayload } from "vite";
import { Body2d, Simulation } from "./gravity";
import { Vector2D } from "tcellib-vectors";

interface CanvasSpace { 
    //use this to transform simulationSpace to canvasSpace and back
    origin: Vector2D, //the canvas' origin in simulation space
    zoomFactor: number, //simulationUnits (meter) per canvasUnit
    orientationY: number; //in practice this is -1, as the y-axis of the canvas is in the opposite direction of the simulation
}

document.addEventListener("DOMContentLoaded", initialize);
//let offscreenCanvas: OffscreenCanvas; //use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas: HTMLCanvasElement;
//let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D; //coming soon
let visibleCanvasCtx: CanvasRenderingContext2D;
let statusBar1: HTMLElement, statusBar2: HTMLElement, statusBar3: HTMLElement;
let simState: Simulation;
let canvasSpace: CanvasSpace;
let frameLength = 25; //ms
let animationRunning = false; //set to true while the sim is running
let zoomStep = 1; //simUnits that get added to or subtracted from one canvasUnit in a zoom steps
//#region page stuff
function initialize() {
    statusBar1 = document.getElementById("statusText1")!;
    statusBar2 = document.getElementById("statusText2")!;
    statusBar3 = document.getElementById("statusText3")!;
    registerEvents();
    initCanvas(1280, 720);
    canvasSpace = {origin: {x: 0, y: 0}, zoomFactor: 1, orientationY: -1};
    simState = new Simulation();
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("cvsBtnStartSim")?.addEventListener("click", startNewSimulation);
    document.getElementById("cvsBtnToggleSim")?.addEventListener("click", toggleSimulation);
    document.getElementById("cvsBtnZoomOut")?.addEventListener("click", zoomOut);
    document.getElementById("cvsBtnZoomIn")?.addEventListener("click", zoomIn);
}
function setStatusMessage(newMessage: string, element?: HTMLElement) {
    if (element === undefined) {
        element = statusBar1;
    }
    element.innerHTML = newMessage;
}
function appendStatusMessage(newMessage: string, element?: HTMLElement) {
    if (element === undefined) {
        element = statusBar1;
    }
    element.innerHTML += newMessage;
}
function genericTest() {
    setStatusMessage("generate an element, add to bodies, draw bodies");
    let newB = new Body2d(1, 5);
    let newPos: Vector2D = {x: 100, y: 100};
    drawBody(newB, newPos)
}
function initCanvas(width: number, height: number) {
    visibleCanvas = (document.getElementById("theCanvas")) as HTMLCanvasElement;
    visibleCanvas.width = width;
    visibleCanvas.height = height;
    visibleCanvasCtx = visibleCanvas.getContext("2d")!;
    appendStatusMessage(` - Canvas dimension: ${width} * ${height}`, statusBar3);
    //offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
    //offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
}
function log(message: string) {
    const timestamp = new Date();
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');

    const formattedTimestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    console.log(`[${formattedTimestamp}] ${message}`);
};

//#endregion
//#region canvas and drawing stuff

function drawVector(position: Vector2D, direction: Vector2D, color?: string) {
    //optionally normalize the direction and scale later
    if (color === undefined) { color = "white" }
    let endPosition: Vector2D = Vector2D.add(position, direction);
    visibleCanvasCtx.beginPath();
    visibleCanvasCtx.lineWidth = 3;
    visibleCanvasCtx.strokeStyle = color;
    visibleCanvasCtx.moveTo(position.x, position.y);
    visibleCanvasCtx.lineTo(endPosition.x, endPosition.y);
    visibleCanvasCtx.stroke();
}
/**
 * draws a circular body at specified position, in specified color
 * @param body 
 * @param position 
 * @param color default white
 */
function drawBody(body: Body2d, position: Vector2D) {
    let visibleRadius = Math.max(body.radius / canvasSpace.zoomFactor, 1); //Minimum Radius of displayed body is one
    visibleCanvasCtx.beginPath();
    visibleCanvasCtx.arc(position.x, position.y, visibleRadius, 0, Math.PI * 2); //zF = m/cu; r...m -> r/zF -> (m)/
    visibleCanvasCtx.closePath();
    visibleCanvasCtx.fillStyle = body.color;
    visibleCanvasCtx.fill();
}
function drawBodies() {
    const objects = simState.objectStates;
    objects.forEach(object => {
        if (object !== null) {
            drawBody(object.body, simulationSpaceToCanvasSpace(object.position));
        }
    });
}
function drawSimulationState() {
    visibleCanvasCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height)
    drawBodies();
    drawVectors();
}
function drawVectors() {
    simState.objectStates.forEach(objectState => {
        drawVector(simulationSpaceToCanvasSpace(objectState.position), simulationSpaceToCanvasSpace(objectState.acceleration), "green");
        drawVector(simulationSpaceToCanvasSpace(objectState.position), simulationSpaceToCanvasSpace(objectState.velocity), "red");
    });
}
function simulationSpaceToCanvasSpace(simVector: Vector2D): Vector2D {
    //transformation:
    //1. shift (point in SimSpace - Origin of C in SimSpace)
    //2. flip (y axis are in opposite directions)
    //3. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const shifted: Vector2D = Vector2D.subtract(simVector, canvasSpace.origin);
    const flipped: Vector2D = {x: shifted.x, y: shifted.y * -1}
    const scaled: Vector2D = Vector2D.scale(flipped, 1/canvasSpace.zoomFactor);
    return scaled;
}
function canvasSpaceToSimulationSpace(canvasVector: Vector2D): Vector2D {
    //transformation:
    //1. scale (canvasVector * zoom in simulationUnits/canvasUnit)
    //2. flip (y axis are in opposite directions)
    //3. shift (scaledAndFlippedPoint + Origin of C in SimSpace)
    let simulationVector: Vector2D;
    simulationVector = Vector2D.add(Vector2D.hadamardProduct(Vector2D.scale(canvasVector, canvasSpace.zoomFactor), {x: 1, y: canvasSpace.orientationY}), canvasSpace.origin)
    return simulationVector;
}

function zoomOut() {
    let zoomCenter: Vector2D = {x: visibleCanvas.width/2, y: visibleCanvas.height/2};
    let newZoom = canvasSpace.zoomFactor + zoomStep;

    let shiftOriginX = zoomCenter.x * zoomStep;
    let shiftOriginY = zoomCenter.y * zoomStep;

    canvasSpace.origin = {x: canvasSpace.origin.x - shiftOriginX, y: canvasSpace.origin.y + shiftOriginY};
    canvasSpace.zoomFactor = newZoom; 
}
function zoomIn() {
    if (canvasSpace.zoomFactor <= 1) { return; }
    let zoomCenter: Vector2D = {x: visibleCanvas.width/2, y: visibleCanvas.height/2};
    let newZoom = canvasSpace.zoomFactor - zoomStep;

    let shiftOriginX = zoomCenter.x * zoomStep; //zoomCenter.x = distance CanvasOrigin to zoomCenter. multiply by zoomStep to get target change in distance in simUnits
    let shiftOriginY = zoomCenter.y * zoomStep;

    canvasSpace.origin = {x: canvasSpace.origin.x + shiftOriginX, y: canvasSpace.origin.y - shiftOriginY};
    canvasSpace.zoomFactor = newZoom;
}
function drawCoordinateSystem() {

}
//#endregion
//#region simulation
function setupSimulationState() {
    let width = visibleCanvas.width;
    let height = visibleCanvas.height;
    let canvasMiddle: Vector2D = { x: width / 2, y: height / 2 };

    /* setup one - with zoom = 1*/
    //let startA: Vector2D = canvasSpaceToSimulationSpace({ x: canvasMiddle.x - 50 , y: canvasMiddle.y + 50});
    //let startB: Vector2D = canvasSpaceToSimulationSpace({ x: canvasMiddle.x + 50 , y: canvasMiddle.y - 50});
    //let velA: Vector2D = {x: 40, y: -50 };
    //let velB: Vector2D = {x: -40, y: 50 };
    //addBody(newBody(1000), startA, velA);
    //addBody(newBody(1000), startB, velB);

    /* setup two - with zoom = 1 */
    //let startA: Vector2D = canvasSpaceToSimulationSpace({ x: canvasMiddle.x - width / 8 , y: canvasMiddle.y});
    //let startB: Vector2D = canvasSpaceToSimulationSpace({ x: canvasMiddle.x + width / 8 , y: canvasMiddle.y});
    //addBody(newBody(100000), startA);
    //addBody(newBody(100000), startB);
   
    /* setup three - with zoom = 1 */
    //let startA: Vector2D = { x: 200, y: -100};
    //let startB: Vector2D = { x: 400, y: -100};
    //let startC: Vector2D = { x: 300, y: -200};
    //addBody(newBody(1000000, 10), startA);-
    //addBody(newBody(1000000, 10), startB);
    //addBody(newBody(1000000, 10), startC);    
   
    /* setup four */
    //this is a stable orbit (g = 1, tickLength = 10. ~3300 ticks)  
    let startA: Vector2D = { x: 640, y: -360};
    let startB: Vector2D = { x: 1140, y: -410};
    let velA: Vector2D = {x: 0, y: 0 };
    let velB: Vector2D = {x: -110, y: -110 };
    addBody(newBody(10000000, 50), startA, velA);
    addBody(newBody(1000), startB, velB);   

    /* setup five - with zoom = 1 */ 
    //let startA: Vector2D = canvasSpaceToSimulationSpace({ x: width/3, y: height * 2/3});
    //let startB: Vector2D = canvasSpaceToSimulationSpace({ x: canvasMiddle.x + 500 , y: canvasMiddle.y - 50});
    //let velA: Vector2D = {x: 0, y: 0 };
    //let velB: Vector2D = {x: -110, y: -110 };
    //addBody(newBody(10000000, 50), startA, velA);
    //addBody(newBody(10000000, 50), startB, velB);
}
function toggleSimulation(this: HTMLElement, ev: MouseEvent) {
    if (simState.running) {
        animationRunning = false;
        simState.pause();
        document.getElementById("cvsBtnToggleSim")!.innerHTML = "Resume";
        setStatusMessage("Simulation paused");
    } else {
        document.getElementById("cvsBtnToggleSim")!.innerHTML = "Pause";
        resumeSimulation();
        drawRunningSimulation();
        setStatusMessage("Simulation running");
    }
}
/**
 * 
 * @param body 
 * @param position in **SIMULATION SPACE**
 * @param velocity in **SIMULATION SPACE**
 * @param movable 
 */
function addBody(body?: Body2d, position?: Vector2D, velocity?: Vector2D, movable?: boolean) {
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

    simState.addObject(objectState);

}
function startNewSimulation() {
    simState.clearObjects();
    simState.tickCount = 0;
    setStatusMessage("Simulation running");
    document.getElementById("cvsBtnToggleSim")!.innerHTML = "Pause";
    
    setupSimulationState();
    simState.run();
    drawRunningSimulation();
}
function resumeSimulation() {
    if (!simState.running) {
        simState.run();
        drawRunningSimulation();
    }
}
function drawRunningSimulation() {
    if (animationRunning) {
        return;
    }
    animationRunning = true;
    const runDrawLoop = () => {
        if (animationRunning) {
            drawSimulationState();
            setStatusMessage(`Simulation Tick: ${simState.tickCount}`, statusBar2);
            setTimeout(runDrawLoop, frameLength);
            //log("Draw simulation step");
        }
    };
    runDrawLoop();
}
function newBody(): Body2d 
function newBody(mass: number, radius: number): Body2d 
function newBody(mass: number, radius?: number): Body2d 
function newBody(mass?: number, radius?: number): Body2d {
    let body1: Body2d;
    if (mass === undefined && radius === undefined) {
        body1 = new Body2d(rng(20, 200));    
    } else if (radius === undefined) {
        body1 = new Body2d(mass);
    } 
    else {
        body1 = new Body2d(mass, radius);
    }
    return body1;
}
//#endregion
//#region other stuff
/**
 * min and max included
 * @returns random number
 */
function rng(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
//#endregion