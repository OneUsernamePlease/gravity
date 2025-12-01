import { Body2d } from "./gravity";
import * as util from "./essentials";
import { IUI, RadioButtonGroup, StatusBar } from "./types";
import { App } from "./app";

export class UI implements IUI {
// All UI Elements
    statusBar: StatusBar;
    resetButton: HTMLInputElement;
    playPauseButton: HTMLInputElement;
    stepButton: HTMLInputElement;
    repositoryLink: HTMLElement;
    zoomInButton: HTMLInputElement;
    zoomOutButton: HTMLInputElement;
    scrollUpButton: HTMLInputElement;
    scrollDownButton: HTMLInputElement;
    scrollLeftButton: HTMLInputElement;
    scrollRightButton: HTMLInputElement;
    displayVectorsCheckbox: HTMLInputElement;
    collisionDetectionCheckbox: HTMLInputElement;
    elasticCollisionsCheckbox: HTMLInputElement;
    gravitationalConstantInput: HTMLInputElement;
    gravitationalConstantRangeInput: HTMLInputElement;
    clickAction: RadioButtonGroup;
    massInput: HTMLInputElement;
    addBodyMovable: HTMLInputElement;

    
    //#region get, set


    //#endregion
    constructor(private app: App) {
        this.resetButton                        = document.getElementById("btnResetSim")! as HTMLInputElement;
        this.playPauseButton                    = document.getElementById("btnToggleSim")! as HTMLInputElement;
        this.stepButton                         = document.getElementById("btnNextStep")! as HTMLInputElement;
        this.repositoryLink                     = document.getElementById("repoLink")!;
        this.zoomInButton                       = document.getElementById("btnZoomIn")! as HTMLInputElement;
        this.zoomOutButton                      = document.getElementById("btnZoomOut")! as HTMLInputElement;
        this.scrollUpButton                     = document.getElementById("btnScrollUp")! as HTMLInputElement;
        this.scrollDownButton                   = document.getElementById("btnScrollDown")! as HTMLInputElement;
        this.scrollLeftButton                   = document.getElementById("btnScrollLeft")! as HTMLInputElement;
        this.scrollRightButton                  = document.getElementById("btnScrollRight")! as HTMLInputElement;
        this.displayVectorsCheckbox             = document.getElementById("cbxDisplayVectors")! as HTMLInputElement;
        this.collisionDetectionCheckbox         = document.getElementById("cbxCollisions")! as HTMLInputElement;
        this.elasticCollisionsCheckbox          = document.getElementById("cbxElasticCollisions")! as HTMLInputElement;
        this.gravitationalConstantInput         = document.getElementById("numberG")! as HTMLInputElement;
        this.gravitationalConstantRangeInput    = document.getElementById("rangeG")! as HTMLInputElement;
        this.massInput                          = document.getElementById("massInput")! as HTMLInputElement;
        this.addBodyMovable                     = document.getElementById("cbxBodyMovable")! as HTMLInputElement;
        this.clickAction = {
            name: "radioBtnMouseAction",
            buttons: Array.from(document.querySelectorAll('input[name="radioBtnMouseAction"]')) as HTMLInputElement[]
        };
        this.statusBar = (() => {
            const bar = document.getElementById("statusBar") as HTMLDivElement;
            return {
                bar: bar,
                fields: Array.from((bar.querySelectorAll(".statusBarItem")) as NodeListOf<HTMLSpanElement>)
            };
        })();

        this.registerEvents();
    }
    public initialize() {
        this.elasticCollisionsCheckbox.disabled = !this.collisionDetectionCheckbox.checked;
        this.massInput.step = this.calculateMassInputStep();
        
        if (this.displayVectorsCheckbox.checked) {
            this.setStatusMessage("Green: acceleration - Red: velocity", 3);
        } else {
            this.setStatusMessage("", 3);
        }
        
        this.setStatusMessage(`Canvas dimension: ${this.app.gravityAnimationController.width} * ${this.app.gravityAnimationController.height}`, 5);

        this.app.setG(Number(this.gravitationalConstantRangeInput.value));
    }
    private registerEvents() {
        this.resetButton.addEventListener("click", () => this.app.reset());
        this.playPauseButton.addEventListener("click", () => this.app.toggleSimulation());
        this.stepButton.addEventListener("click", () => this.app.advanceOneTick());
        this.zoomInButton.addEventListener("click", () => this.app.zoomIn());
        this.zoomOutButton.addEventListener("click", () => this.app.zoomOut());
        this.scrollUpButton.addEventListener("click", () => this.app.scrollViewUp());
        this.scrollDownButton.addEventListener("click", () => this.app.scrollViewDown());
        this.scrollLeftButton.addEventListener("click", () => this.app.scrollViewLeft());
        this.scrollRightButton.addEventListener("click", () => this.app.scrollViewRight());
        this.displayVectorsCheckbox.addEventListener("change", () => this.cbxDisplayVectorsChanged());
        this.collisionDetectionCheckbox.addEventListener("change", () => this.cbxCollisionsChanged());
        this.elasticCollisionsCheckbox.addEventListener("change", () => this.cbxElasticCollisionsChanged());
        this.gravitationalConstantInput.addEventListener("change", () => this.numberInputGChanged());
        this.gravitationalConstantRangeInput.addEventListener("input", () => this.rangeInputGChanged());
        this.massInput.addEventListener("change", () => this.updateSelectedMass());
    }
    public cbxDisplayVectorsChanged() {
        const displayVectors = this.displayVectorsCheckbox.checked;
        this.app.setDisplayVectors(displayVectors)
        if (displayVectors) {
            this.setStatusMessage("Green: acceleration - Red: velocity", 3);
        } else {
            this.setStatusMessage("", 3);
        }
    }
    public cbxCollisionsChanged() {
        const checked = this.collisionDetectionCheckbox.checked;
        const elasticChecked = this.elasticCollisionsCheckbox.checked;
        
        this.elasticCollisionsCheckbox.disabled = !checked;
        
        this.app.setCollisionDetection(checked, elasticChecked);
    }
    public cbxElasticCollisionsChanged() {
        this.app.setElasticCollisions(this.elasticCollisionsCheckbox.checked);
    }
    public numberInputGChanged() {
        const newG: string = this.gravitationalConstantInput.value;
        this.gravitationalConstantRangeInput.value = newG;
        this.app.setG(Number(newG));
    }
    public rangeInputGChanged() {
        const newG: string = this.gravitationalConstantRangeInput.value;
        if (this.gravitationalConstantInput.value !== newG) {
            this.gravitationalConstantInput.value = newG;
            this.app.setG(Number(newG));
        }
    }
    public simulationStopped() {
        this.playPauseButton.innerHTML = "&#9654;"; // play symbol
        this.stepButton.disabled = false;
    }
    public simulationResumed() {
        this.playPauseButton.innerHTML = "&#10074;&#10074;"; // pause symbol
        
        (this.stepButton as HTMLInputElement)!.disabled = true;
        this.app.updateStatusBarSimulationMessages();
    }
    public updateStatusBarZoom() {
        const currentZoom = this.app.gravityAnimationController.currentZoom;
        this.setStatusMessage(`Zoom: ${currentZoom.toFixed(2)} (m per pixel)`, 4);
    }
    public getSelectedClickAction() {
        return this.getSelectedValue(this.clickAction) ?? this.clickAction.buttons[0].value;
    }

    public getSelectedValue(group: RadioButtonGroup): string | null {
        const selected = group.buttons.find(btn => btn.checked);
        return selected?.value ?? null;
    }
    public body2dFromInputs(): Body2d {
        const movable = this.addBodyMovable.checked;
        const mass = util.getInputNumber(this.massInput);

        return new Body2d(util.numberInRange(mass, 1, Number.MAX_SAFE_INTEGER), movable);
    }
    public updateSelectedMass() {
        this.massInput.step = this.calculateMassInputStep();
    }
    /**
     * The step is equal to 10% of the input value, rounded down to the nearest power of 10.
     * @returns Step as a string. Step is always at least 1 or larger.
     */
    private calculateMassInputStep(): string {
        let step = (10 ** (Math.floor(Math.log10(util.getInputNumber(this.massInput))) - 1));
        return step < 1 ? "1" : step.toString();
    }
    /**
     * @param fieldIndexOrId number of field (starting at one) OR id of the field
     */
    public setStatusMessage(message: string, fieldIndexOrId?: number | string, append: boolean = false) {
        let element: HTMLElement;
        if (typeof fieldIndexOrId === "number") {
            element = this.statusBar.fields[fieldIndexOrId - 1];
        } else if (typeof fieldIndexOrId === "string") {
            element = document.getElementById(fieldIndexOrId)!;
        } else {
            element = this.statusBar.fields[0];
        }
        
        if (append) {
            element!.innerHTML += message;
        } else {
            element!.innerHTML = message;
        }
    }

}