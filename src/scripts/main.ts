import { Vector2D } from "./vector2d";
import { MouseBtnState } from "./types";
import { Canvas } from "./canvas";
import * as tsEssentials from "./essentials";
import { Sandbox } from "./sandbox";
import * as c from "../const";

let sandbox: Sandbox; // ie. gravity-animation-controller
// ui Objects (toDo) 

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    document.removeEventListener("DOMContentLoaded", initialize);
    registerEvents();

    initializeSandbox();
    initializeSettingsFromUI();

    sandbox.run();
}
function initializeSandbox() {
    sandbox = new Sandbox(new Canvas(<HTMLCanvasElement>document.getElementById(c.CANVAS_ID)));
    sandbox.ui.initStatusBar(<HTMLDivElement>(document.getElementById(c.STATUS_BAR_ID)));
    sandbox.initCanvasAndSimulation({x: window.innerWidth, y: window.innerHeight});
}
function initializeSettingsFromUI() {
    // REFACTOR ME: create a proper UI(+settings) object
    sandbox.selectedCanvasClickAction = (document.querySelector('input[name="radioBtnMouseAction"]:checked') as HTMLInputElement).value;
    
    (<HTMLInputElement>document.getElementById("cbxElasticCollisions")).disabled = !sandbox.simulation.collisionDetection;

    if ((<HTMLInputElement>document.getElementById("cbxDisplayVectors"))?.checked) {
        sandbox.ui.setStatusMessage("Green: acceleration - Red: velocity", 3);
    } else {
        sandbox.ui.setStatusMessage("", 3);
    }

    setG(Number((<HTMLInputElement>document.getElementById("rangeG")).value));
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
    document.getElementById(c.CANVAS_ID)?.addEventListener("mousedown", canvasMouseDown);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mouseup", canvasMouseUp);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mouseout", canvasMouseOut);
    document.getElementById(c.CANVAS_ID)?.addEventListener("mousemove", canvasMouseMove);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchstart", canvasTouchStart);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchend", canvasTouchEnd);
    document.getElementById(c.CANVAS_ID)?.addEventListener("touchmove", canvasTouchMove);
    document.getElementById(c.CANVAS_ID)?.addEventListener("wheel", canvasMouseWheel);
    document.getElementById(c.CANVAS_ID)?.addEventListener("contextmenu", (ev) => {ev.preventDefault()});
    document.getElementById(c.MASS_INPUT_ID)?.addEventListener("change", massInputChanged);
    document.getElementById("cbxDisplayVectors")?.addEventListener("change", cbxDisplayVectorsChanged);
    document.getElementById("cbxCollisions")?.addEventListener("change", cbxCollisionsChanged);
    document.getElementById("cbxElasticCollisions")?.addEventListener("change", cbxElasticCollisionsChanged);
    document.getElementById("rangeG")?.addEventListener("input", rangeInputGChanged);
    document.getElementById("numberG")?.addEventListener("input", numberInputGChanged);
    document.querySelectorAll('input[name="radioBtnMouseAction"]').forEach((radioButton) => {
        radioButton.addEventListener('change', radioBtnMouseActionChanged);
      });
    window.addEventListener("resize", windowResized);
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
    const displayVectors = checkbox ? checkbox.checked : false;
    sandbox.animationSettings.displayVectors = displayVectors;
    
    if (displayVectors) {
        sandbox.ui.setStatusMessage("Green: acceleration - Red: velocity", 3);
    } else {
        sandbox.ui.setStatusMessage("", 3);
    }

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
    if (sandbox.running) {
        (<HTMLInputElement>document.getElementById("btnNextStep"))!.disabled = true;
    } else {
        (<HTMLInputElement>document.getElementById("btnNextStep"))!.disabled = false;
    }
}
function rangeInputGChanged(this: HTMLElement, ev: Event) {
    const newG: string = (<HTMLInputElement>this).value;
    (<HTMLInputElement>document.getElementById("numberG"))!.value = newG;
    setG(Number(newG));
}
function numberInputGChanged(this: HTMLElement, ev: Event) {
    const newG: string = (<HTMLInputElement>this).value;
    (<HTMLInputElement>document.getElementById("rangeG"))!.value = newG;
    setG(Number(newG));
}
function setG(g: number) {
    if (isNaN(g) || g < c.MIN_G || g > c.MAX_G) {
        g = c.DEFAULT_G;
    }
    sandbox.simulation.g = g;
}
function nextStepClicked() {
    sandbox.advanceSimulation();
}
function resetClicked() {
    sandbox.reset();
}
function canvasMouseDown(this: HTMLElement, ev: MouseEvent) {
    if (ev.button === 0) {
        sandbox.mainMouseDown(ev);
    } else if (ev.button === 1) {
        // prevent scroll-symbol
        ev.preventDefault();
    } else if (ev.button === 2) {
        sandbox.secondaryMouseDown(ev);
    }
}
function canvasMouseMove(this: HTMLElement, ev: MouseEvent) {
    sandbox.mouseMoving(ev);
}
function canvasMouseUp(this: HTMLElement, ev: MouseEvent) {
    if (ev.button === 0) {
        sandbox.mainMouseUp(ev);
    } else if (ev.button === 2) {
        sandbox.secondaryMouseUp(ev);
    }
}
function canvasMouseOut(this: HTMLElement, ev: MouseEvent) {
    sandbox.canvasMainMouseState = MouseBtnState.Up;
    sandbox.canvasSecondaryMouseState = MouseBtnState.Up;
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
function windowResized(this: Window, ev: UIEvent) {
    sandbox.resizeCanvas(this.innerWidth, this.innerHeight);
    sandbox.ui.setStatusMessage(`Canvas dimension: ${this.innerWidth} * ${this.innerHeight}`, 5);
}
function canvasMouseWheel(this: HTMLElement, ev: WheelEvent) {
    // don't resize the entire page
    ev.preventDefault();
    
    const canvasRect = this.getBoundingClientRect();
    const cursorPos = new Vector2D(ev.clientX - canvasRect.left, ev.clientY - canvasRect.top);
    
    if (ev.deltaY < 0) {
        sandbox.zoomIn(cursorPos);
    } else if (ev.deltaY > 0) {
        sandbox.zoomOut(cursorPos);
    }
}
