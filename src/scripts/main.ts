import { InferCustomEventPayload } from "vite";
import { Body2d, Simulation } from "./gravity";
import { Vector2D } from "tcellib-vectors";

document.addEventListener("DOMContentLoaded", initialize);
//let offscreenCanvas: OffscreenCanvas; //use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas: HTMLCanvasElement;
//let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D; //coming soon
let visibleCanvasCtx: CanvasRenderingContext2D;
let statusBar1: HTMLElement, statusBar2: HTMLElement, statusBar3: HTMLElement;
let simState: Simulation;
let frameLength = 25; //ms
let animationRunning = false; //set to true while the sim is running
//#region page stuff
function initialize() {
    statusBar1 = document.getElementById("statusText1")!;
    statusBar2 = document.getElementById("statusText2")!;
    statusBar3 = document.getElementById("statusText3")!;
    registerEvents();
    initCanvas(1280, 720);
    simState = new Simulation();
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("canvasBtn1")?.addEventListener("click", genericTest);
    document.getElementById("canvasBtn2")?.addEventListener("click", genericTest2);
    document.getElementById("canvasBtnStartSim")?.addEventListener("click", startNewSimulation);
    document.getElementById("canvasBtnToggleSim")?.addEventListener("click", toggleSimulation);
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
function genericTest2() {
    let w = visibleCanvas.width;
    let h = visibleCanvas.height;
    setStatusMessage(`Canvas dimension: ${w} * ${h}`, statusBar3);
}
function initCanvas(width: number, height: number) {
    visibleCanvas = (document.getElementById("theCanvas")) as HTMLCanvasElement;
    visibleCanvas.width = width;
    visibleCanvas.height = height;
    visibleCanvasCtx = visibleCanvas.getContext("2d")!;
    appendStatusMessage(`Canvas dimension: ${width} * ${height}`, statusBar3);
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
    visibleCanvasCtx.beginPath();
    visibleCanvasCtx.arc(position.x, position.y, body.radius, 0, Math.PI * 2);
    visibleCanvasCtx.closePath();
    visibleCanvasCtx.fillStyle = body.color;
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
    drawVectors();
}
function drawVectors() {
    simState.objectStates.forEach(objectState => {
        drawVector(objectState.position, objectState.acceleration, "green");
        drawVector(objectState.position, objectState.velocity, "red");
    });
}
//#endregion
//#region simulation
function setupSimulationState() {
    let width = visibleCanvas.width;
    let height = visibleCanvas.height;
    let middle: Vector2D = { x: width / 2, y: height / 2 };

    /* setup one - looks like something is not working correctly*/
    let startA: Vector2D = { x: middle.x - 50 , y: middle.y + 20};
    let startB: Vector2D = { x: middle.x + 50 , y: middle.y - 20};
    let velA: Vector2D = {x: 0, y: 100 };
    let velB: Vector2D = {x: 0, y: -100 };
    addBody(newBody(100, 10), startA, velA);
    addBody(newBody(10, 10), startB, velB);

    /* setup two */
    //let startA: Vector2D = { x: middle.x - width / 4 , y: middle.y};
    //let startB: Vector2D = { x: middle.x + width / 4 , y: middle.y};
    //addBody(newBody(10, 10), startA);
    //addBody(newBody(10, 10), startB);
   
    /* setup three */
    //let startA: Vector2D = { x: 200, y: 100};
    //let startB: Vector2D = { x: 400, y: 100};
    //let startC: Vector2D = { x: 300, y: 200};
    //addBody(newBody(10, 10), startA);
    //addBody(newBody(10, 10), startB);
    //addBody(newBody(10, 10), startC);    
   
    /* setup four */   
    //let startA: Vector2D = { x: middle.x, y: middle.y};
    //let startB: Vector2D = { x: middle.x + 400 , y: middle.y - 50};
    //let velA: Vector2D = {x: 0, y: 0 };
    //let velB: Vector2D = {x: -300, y: 300 };
    //addBody(newBody(180, 10), startA, velA);
    //addBody(newBody(6, 10), startB, velB);
    
}
function toggleSimulation(this: HTMLElement, ev: MouseEvent) {
    if (simState.running) {
        animationRunning = false;
        simState.pause();
        document.getElementById("canvasBtnToggleSim")!.innerHTML = "Resume";
        setStatusMessage("Simulation paused");
    } else {
        document.getElementById("canvasBtnToggleSim")!.innerHTML = "Pause";
        resumeSimulation();
        drawRunningSimulation();
        setStatusMessage("Simulation running");
    }
}

function addBody(body?: Body2d, position?: Vector2D, velocity?: Vector2D, acceleration?: Vector2D) {
    if (body === undefined) {
        body = newBody();
    }
    if (position === undefined) {
        const x = rng(body.radius, visibleCanvas.width - body.radius);
        const y = rng(body.radius, visibleCanvas.height - body.radius);
        position = {x: x, y: y}
    }
    if (velocity === undefined) {
        velocity = {x: 0, y: 0};
    }
    if (acceleration === undefined) {
        acceleration = {x: 0, y: 0};
    }
    const objectState = {body: body, position: position, velocity: velocity, acceleration: acceleration};

    simState.addObject(objectState);

}
function startNewSimulation() {
    simState.clearObjects();
    simState.tickCount = 0;
    setStatusMessage("Simulation running");
    document.getElementById("canvasBtnToggleSim")!.innerHTML = "Pause";
    
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