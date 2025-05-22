import { Vector2D } from "./vector2d";
import { CanvasClickAction, MouseBtnState } from "./types";
import { Canvas } from "./canvas";
import * as tsEssentials from "./essentials";
import { Sandbox } from "./sandbox";
import { MASS_INPUT_ID, CANVAS_ID } from "../const";

let sandbox: Sandbox;

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    registerEvents();
    sandbox = new Sandbox(new Canvas(<HTMLCanvasElement>document.getElementById(CANVAS_ID)));
    sandbox.initStatusBar("statusText"); // REFACTOR ME: use status bar instead of id-beginning of its fields
    sandbox.initSandbox({x: 1280, y: 720});
    sandbox.selectedCanvasClickAction = (document.querySelector('input[name="radioBtnMouseAction"]:checked') as HTMLInputElement).value;
    (<HTMLInputElement>document.getElementById("cbxElasticCollisions")).disabled = !sandbox.simulation.collisionDetection;
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
    document.getElementById(CANVAS_ID)?.addEventListener("mousedown", canvasMouseDown);
    document.getElementById(CANVAS_ID)?.addEventListener("mouseup", canvasMouseUp);
    document.getElementById(CANVAS_ID)?.addEventListener("mouseout", canvasMouseOut);
    document.getElementById(CANVAS_ID)?.addEventListener("mousemove", canvasMouseMove);
    document.getElementById(CANVAS_ID)?.addEventListener("touchstart", canvasTouchStart);
    document.getElementById(CANVAS_ID)?.addEventListener("touchend", canvasTouchEnd);
    document.getElementById(CANVAS_ID)?.addEventListener("touchmove", canvasTouchMove);
    document.getElementById(MASS_INPUT_ID)?.addEventListener("change", massInputChanged);
    document.getElementById("cbxDisplayVectors")?.addEventListener("change", cbxDisplayVectorsChanged);
    document.getElementById("cbxCollisions")?.addEventListener("change", cbxCollisionsChanged);
    document.getElementById("cbxElasticCollisions")?.addEventListener("change", cbxElasticCollisionsChanged);
    document.querySelectorAll('input[name="radioBtnMouseAction"]').forEach((radioButton) => {
        radioButton.addEventListener('change', radioBtnMouseActionChanged);
      });
}
function zoomOutClicked(this: HTMLElement, ev: MouseEvent) {
    const zoomCenter = new Vector2D(sandbox.canvas.visibleCanvas.width / 2, sandbox.canvas.visibleCanvas.height / 2)
    sandbox.zoomOut(zoomCenter);
}
function zoomInClicked(this: HTMLElement, ev: MouseEvent) {
    const zoomCenter = new Vector2D(sandbox.canvas.visibleCanvas.width / 2, sandbox.canvas.visibleCanvas.height / 2)
    sandbox.zoomIn(zoomCenter);
}
function scrollLeftClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasLeft();
}
function scrollRightClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasRight();
}
function scrollUpClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasUp();
}
function scrollDownClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.moveCanvasDown();
}
function massInputChanged(this: HTMLElement) {
    sandbox.massInputChanged(this as HTMLInputElement);
}
function cbxCollisionsChanged(event: Event) {
    const checked = tsEssentials.isChecked(event.target as HTMLInputElement);
    const cbxElastic: HTMLInputElement = <HTMLInputElement>document.getElementById("cbxElasticCollisions");
    const elasticChecked = tsEssentials.isChecked(cbxElastic);
    sandbox.simulation.collisionDetection = checked;
    sandbox.simulation.elasticCollisions = elasticChecked;

    cbxElastic.disabled = !checked;
}
function cbxElasticCollisionsChanged(event: Event) {
    const checked = tsEssentials.isChecked(event.target as HTMLInputElement);
    sandbox.simulation.elasticCollisions = checked;
}
function cbxDisplayVectorsChanged(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    sandbox.animationSettings.displayVectors = checkbox ? checkbox.checked : false;
    if (!sandbox.running) {
        sandbox.canvas.redrawSimulationState(sandbox.simulation.simulationState, sandbox.animationSettings.displayVectors);
    }
}
function radioBtnMouseActionChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.type === 'radio') {
        sandbox.selectedCanvasClickAction = target.value;
    }
}
function toggleSimulationClicked(this: HTMLElement, ev: MouseEvent) {
    sandbox.toggleSimulation();
}
function nextStepClicked() {
    sandbox.advanceSimulation();
}
function resetClicked() {
    sandbox.reset();
    document.getElementById("btnToggleSim")!.innerHTML = "Play";
}
function canvasMouseDown(this: HTMLElement, ev: MouseEvent) {
    if (ev.button === 0) {
        sandbox.leftMouseDown(ev);
    }
}
function canvasMouseMove(this: HTMLElement, ev: MouseEvent) {
    sandbox.mouseMoving(ev);
}
function canvasMouseUp(this: HTMLElement, ev: MouseEvent) {
    if (ev.button === 0) {
        sandbox.leftMouseUp(ev);
    }
}
function canvasMouseOut(this: HTMLElement, ev: MouseEvent) {
    sandbox.canvasLeftMouseState = MouseBtnState.Up;
}
function canvasTouchStart(this: HTMLElement, ev: TouchEvent) {
    sandbox.canvasTouchStart(ev);
}
function canvasTouchMove(this: HTMLElement, ev: TouchEvent) {
    //sandbox.canvasTouchMove(ev);
}
function canvasTouchEnd(this: HTMLElement, ev: TouchEvent) {
    sandbox.canvasTouchEnd(ev);
}
