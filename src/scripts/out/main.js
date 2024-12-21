"use strict";
document.addEventListener("DOMContentLoaded", initialize);
let offscreenCanvas; //use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas;
let offscreenCanvasCtx;
let visibleCanvasCtx;
let statusBar;
function initialize() {
    registerEvents();
    initCanvas();
    statusBar = document.getElementById("statusText");
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    var _a;
    (_a = document.getElementById("canvasBtn1")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", genericTest);
}
function genericTest() {
    setStatusMessage("drawing something");
    offscreenCanvasCtx.fillStyle = 'blue';
    offscreenCanvasCtx.fillRect(0, 0, 25, 25);
    offscreenCanvasCtx.fillStyle = 'green';
    offscreenCanvasCtx.fillRect(10, 10, 10, 10);
    visibleCanvasCtx.drawImage(offscreenCanvas, 0, 0);
}
function initCanvas() {
    visibleCanvas = (document.getElementById("theCanvas"));
    visibleCanvasCtx = visibleCanvas.getContext("2d");
    offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
    offscreenCanvasCtx = offscreenCanvas.getContext("2d");
}
function setStatusMessage(newMessage) {
    statusBar.innerHTML = newMessage;
}
