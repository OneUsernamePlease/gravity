import { InferCustomEventPayload } from "vite";
import { Body2d, Simulation } from "./gravity";
import { Vector2D, IVector2D } from "tcellib-vectors";

document.addEventListener("DOMContentLoaded", initialize);
//let offscreenCanvas: OffscreenCanvas; //use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas: HTMLCanvasElement;
//let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D; //coming soon
let visibleCanvasCtx: CanvasRenderingContext2D;
let statusBar: HTMLElement;
let simState: Simulation;
let frameLength = 100; //ms
let animationRunning = false; //whether the simState should be drawn every frame; set to true while the sim is running
//#region page stuff
function initialize() {
    registerEvents();
    initCanvas();
    simState = new Simulation();
    statusBar = document.getElementById("statusText")!;
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("canvasBtn1")?.addEventListener("click", genericTest);
    document.getElementById("canvasBtn2")?.addEventListener("click", genericTest2);
    document.getElementById("canvasBtnStartSim")?.addEventListener("click", startNewSimulation);
    document.getElementById("canvasBtnToggleSim")?.addEventListener("click", toggleSimulation);
}
function setStatusMessage(newMessage: string) {
    statusBar.innerHTML = newMessage;
}
function genericTest() {
    setStatusMessage("generate an element, add to bodies, draw bodies");
    let newB = new Body2d(1, 5);
    let newPos: IVector2D = {x: 100, y: 100};
    drawBody(newB, newPos)
}
function genericTest2() {
    let w = visibleCanvas.width;
    let h = visibleCanvas.height;
    setStatusMessage(`Canvas dimension: ${w} * ${h}`);
}
function initCanvas() {
    visibleCanvas = (document.getElementById("theCanvas")) as HTMLCanvasElement;
    visibleCanvas.width = 480;
    visibleCanvas.height = 320;
    visibleCanvasCtx = visibleCanvas.getContext("2d")!;
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
function drawBody(body: Body2d, position: IVector2D, color?: string) {
    if (color === undefined || !(CSS.supports("color", color))) {
        color = "green";
    }
    visibleCanvasCtx.beginPath();
    visibleCanvasCtx.arc(position.x, position.y, body.radius, 0, Math.PI * 2);
    visibleCanvasCtx.closePath();
    visibleCanvasCtx.fillStyle = color;
    visibleCanvasCtx.fill();
}
function drawBodies() {
    const objects = simState.objectStates;
    objects.forEach(object => {
        if (object !== null) {
            drawBody(object.body, object.position)
        }
    });
}
function drawSimulationState() {
    visibleCanvasCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height)
    drawBodies();
}
//#endregion
//#region simulation
function setupSimulationState() {
    addBody();
}
function toggleSimulation(this: HTMLElement, ev: MouseEvent) {
    if (simState.running) {
        animationRunning = false;
        simState.pause();
        document.getElementById("canvasBtnToggleSim")!.innerHTML = "Resume";
    } else {
        animationRunning = true;
        resumeSimulation();
        document.getElementById("canvasBtnToggleSim")!.innerHTML = "Pause";
    }
}

function addBody(body?: Body2d, position?: IVector2D) {
    if (body === undefined) {
        body = newBody();
    }
    if (position === undefined) {
        const x = rng(body.radius, visibleCanvas.width - body.radius);
        const y = rng(body.radius, visibleCanvas.height - body.radius);
        position = {x: x, y: y}
    }
    const vel: IVector2D = {x: 0, y: 0};
    const acc: IVector2D = {x: 0, y: 0};
    const objectState = {body: body, position: position, velocity: vel, acceleration: acc};

    simState.addObject(objectState);

}
function startNewSimulation() {
    //simState.running = true;
    //animationRunning = true;
    simState.tickCount = 0;
    setStatusMessage("Simulation running");
    document.getElementById("canvasBtnToggleSim")!.innerHTML = "Pause";
    setupSimulationState();
    simState.run();
    drawRunningSimulation();
}
function drawRunningSimulation() {
/*
    if (!animationRunning) {
        return;
    }
    setTimeout(() => {
        if (animationRunning) {
            drawRunningSimulation();
        }
        drawSimulationState();
        setStatusMessage(`Simulation Tick: ${simState.tickCount}`)
    }, frameLength);
*/
    if (animationRunning) {
        return;
    }
    animationRunning = true;
    const runDrawLoop = () => {
        if (animationRunning) {
            drawSimulationState();
            setStatusMessage(`Simulation Tick: ${simState.tickCount}`);
            setTimeout(runDrawLoop, frameLength);
            //log("Draw simulation step");
        }
    };
    runDrawLoop();
}

function resumeSimulation() {
    if (!simState.running) {
        simState.running = true;
        simState.run();
        drawRunningSimulation();
    }
}

function newBody(): Body2d 
function newBody(mass: number, radius: number): Body2d 
function newBody(mass?: number, radius?: number): Body2d {
    let body1: Body2d;
    if (mass === undefined && radius === undefined) {
        body1 = new Body2d(rng(20, 200));    
    } else {
        body1 = new Body2d(mass, radius);
    }
    return body1;
}
//#region other stuff
/**
 * min and max included
 * @returns random number
 */
function rng(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
//#endregion