document.addEventListener("DOMContentLoaded", initialize);
let offscreenCanvas: OffscreenCanvas; //use this in a worker thread to render or draw on, then transfer content to the visible html-canvas
let visibleCanvas: HTMLCanvasElement;
let offscreenCanvasCtx: OffscreenCanvasRenderingContext2D;
let visibleCanvasCtx: CanvasRenderingContext2D
let statusBar: HTMLElement;
function initialize() {
    registerEvents();
    initCanvas();

    statusBar = document.getElementById("statusText")!;
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("canvasBtn1")?.addEventListener("click", genericTest)
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
    visibleCanvas = (document.getElementById("theCanvas")) as HTMLCanvasElement;
    visibleCanvasCtx = visibleCanvas.getContext("2d")!;
    offscreenCanvas = new OffscreenCanvas(visibleCanvas.clientWidth, visibleCanvas.clientHeight);
    offscreenCanvasCtx = offscreenCanvas.getContext("2d")!;
}
function setStatusMessage(newMessage: string) {
    statusBar.innerHTML = newMessage;
}
