import { Body2d } from "./gravity";
import * as util from "./essentials";
import { MASS_INPUT_ID } from "../const";
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

    private _selectedMass: number;
    
    //#region get, set

    public get selectedMass() {
        return this._selectedMass;
    }
    public set selectedMass(inputValue: number) {
        this._selectedMass = inputValue;
    }

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
        
        this._selectedMass = util.getInputNumber(this.massInput);

        this.massInput.step = this.calculateMassInputStep();
    }
    private registerEvents() {

        this.resetButton.addEventListener("click", () => this.app.reset());
        this.playPauseButton.addEventListener("click", () => this.app.toggleSimulation());
        this.stepButton.addEventListener("click", () => this.app.advanceOneTick());
        this.zoomInButton.addEventListener("click", () => this.zoomInClicked());
        this.zoomOutButton.addEventListener("click", () => this.zoomOutClicked());
        this.scrollUpButton.addEventListener("click", () => this.app.scrollViewUp());
        this.scrollDownButton.addEventListener("click", () => this.app.scrollViewDown());
        this.scrollLeftButton.addEventListener("click", () => this.app.scrollViewLeft());
        this.scrollRightButton.addEventListener("click", () => this.app.scrollViewRight());
        this.displayVectorsCheckbox.addEventListener("change", () => this.app.cbxDisplayVectorsChanged(this.displayVectorsCheckbox));
        this.collisionDetectionCheckbox.addEventListener("change", () => this.app.cbxCollisionsChanged(this.collisionDetectionCheckbox));
        this.elasticCollisionsCheckbox.addEventListener("change", () => this.app.cbxElasticCollisionsChanged(this.elasticCollisionsCheckbox));
        this.gravitationalConstantInput.addEventListener("", () => this.app.numberInputGChanged(this.gravitationalConstantInput));
        this.gravitationalConstantRangeInput.addEventListener("change", () => this.app.rangeInputGChanged(this.gravitationalConstantRangeInput));
        this.massInput.addEventListener("change", () => this.updateSelectedMass(this.massInput));
                this.clickAction.buttons.forEach((radioButton) => {
            radioButton.addEventListener('change', () => this.radioBtnMouseActionChanged(radioButton));
        });
    }
    public simulationStopped() {
        this.playPauseButton.innerHTML = "&#9654;"; // play symbol
        this.stepButton.disabled = false;
    }
    public simulationResumed() {
        this.playPauseButton.innerHTML = "&#10074;&#10074;"; // pause symbol
        
        (this.stepButton as HTMLInputElement)!.disabled = true;
        this.app.updateSimulationStatusMessages();
    }
    public zoomInClicked() {
        const newZoom = this.app.zoomIn();
        this.setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);
    }
    public zoomOutClicked() {
        const newZoom = this.app.zoomOut();
        this.setStatusMessage(`Zoom: ${newZoom} (m per pixel)`, 4);
    }
    public radioBtnMouseActionChanged(element: HTMLInputElement): void {
        if (element && element.type === 'radio') {
            this.app.selectedCanvasClickAction = element.value;
        }
    }

    public body2dFromInputs(): Body2d {
        const movable = this.addBodyMovable.checked;
        return new Body2d(this.selectedMass, movable);
    }
    public updateSelectedMass(inputElement: HTMLInputElement) {
        const inputValue = inputElement.value;
        this.selectedMass = util.isNumeric(inputValue) ? +inputValue : 0;
        inputElement.step = this.calculateMassInputStep();
    }
    /**
     * The step is equal to 10% of the input value, rounded down to the nearest power of 10.
     * @returns Step as a string. Step is always at least 1 or larger.
     */
    private calculateMassInputStep(): string {
        let step = (10 ** (Math.floor(Math.log10(this.selectedMass)) - 1));
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