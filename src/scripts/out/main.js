"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gravity_1 = require("./gravity");
document.addEventListener("DOMContentLoaded", initialize);
//let offscreenCanvas: OffscreenCanvas; //use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas;
//let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D; //coming soon
let visibleCanvasCtx;
let statusBar;
let bodies = []; //body, position
function initialize() {
    registerEvents();
    initCanvas();
    statusBar = document.getElementById("statusText");
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    var _a, _b;
    (_a = document.getElementById("canvasBtn1")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", genericTest);
    (_b = document.getElementById("canvasBtn2")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", genericTest2);
}
function genericTest() {
    setStatusMessage("generate an element, add to bodies, draw bodies");
    let newB = new gravity_1.Body2d(1, 5);
    let newPos = { x: 50, y: 50 };
    drawBody(newB, newPos);
}
function genericTest2() {
    let w = visibleCanvas.width;
    let h = visibleCanvas.height;
    setStatusMessage(`Canvas dimension: ${w} * ${h}`);
}
function initCanvas() {
    visibleCanvas = (document.getElementById("theCanvas"));
    visibleCanvas.width = 480;
    visibleCanvas.height = 320;
    visibleCanvasCtx = visibleCanvas.getContext("2d");
    //offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
    //offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
}
function setStatusMessage(newMessage) {
    statusBar.innerHTML = newMessage;
}
function drawBody(body, position, color) {
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
//# sourceMappingURL=main.js.map