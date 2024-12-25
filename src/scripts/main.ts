import { Body2d } from "./gravity";
import { Vector2D, IVector2D } from "tcellib-vectors";

document.addEventListener("DOMContentLoaded", initialize);
//let offscreenCanvas: OffscreenCanvas; //use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas: HTMLCanvasElement;
//let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D; //coming soon
let visibleCanvasCtx: CanvasRenderingContext2D;
let statusBar: HTMLElement;
let bodies: { body: Body2d, position: IVector2D }[] = []; //body, position
function initialize() {
    registerEvents();
    initCanvas();


    statusBar = document.getElementById("statusText")!;
    document.removeEventListener("DOMContentLoaded", initialize);
}

function registerEvents() {
    document.getElementById("canvasBtn1")?.addEventListener("click", genericTest);
    document.getElementById("canvasBtn2")?.addEventListener("click", genericTest2);
}
function genericTest() {
    setStatusMessage("generate an element, add to bodies, draw bodies");
    let newB = new Body2d(1, 5);
    let newPos: IVector2D = {x: 100, y: 150};
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
function setStatusMessage(newMessage: string) {
    statusBar.innerHTML = newMessage;
}
function drawBody(body: Body2d, position: IVector2D, color?: string) {
    if (color === undefined) {
        color = "green";
    }
    visibleCanvasCtx.beginPath();
    visibleCanvasCtx.arc(position.x, position.y, body.radius, 0, Math.PI * 2);
    visibleCanvasCtx.closePath();
    visibleCanvasCtx.fillStyle = color;
    visibleCanvasCtx.fill();
}

function drawEnv() {
    bodies.forEach(body => {
        if (body !== null) {
            //drawBody(body[0], body[1]);
        }
    });
}
