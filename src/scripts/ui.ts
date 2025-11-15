import { Body2d } from "./gravity";
import * as tsEssentials from "./essentials";
import { MASS_INPUT_ID } from "../const";
import { IUI } from "./types";

export class UI implements IUI {
// All UI Elements
    private _statusBar: { fields: HTMLSpanElement[] } = { fields: [] };
    resetButton: HTMLElement;
    playPauseButton: HTMLElement;
    stepButton: HTMLElement;
    repositoryLink: HTMLElement;
    zoomInButton: HTMLElement;
    zoomOutButton: HTMLElement;
    scrollUpButton: HTMLElement;
    scrollDownButton: HTMLElement;
    scrollLeftButton: HTMLElement;
    scrollRightButton: HTMLElement;
    displayVectorsCheckbox: HTMLInputElement;
    collisionDetectionCheckbox: HTMLInputElement;
    elasticCollisionsCheckbox: HTMLInputElement;
    gravitationalConstantInput: HTMLInputElement;
    clickActionSelect: HTMLSelectElement;
    addBodyMassInput: HTMLInputElement;
    addBodyMovableCheckbox: HTMLInputElement;
    
    private _selectedMass: number;
    
    //#region get, set
    get statusBar() {
        return this._statusBar;
    }
    public get selectedMass() {
        return this._selectedMass;
    }
    public set selectedMass(inputValue: number) {
        this._selectedMass = inputValue;
    }

    //#endregion
    constructor() {
        this.playPauseButton = document.getElementById("btnToggleSim")!;
        
        
        
        this._selectedMass = tsEssentials.getInputNumber(MASS_INPUT_ID);

        (document.getElementById(MASS_INPUT_ID)! as HTMLInputElement).step = this.calculateMassInputStep();
    }

    public body2dFromInputs(): Body2d {
        const movable = tsEssentials.isChecked("cbxBodyMovable");
        return new Body2d(this.selectedMass, movable);
    }
    public updateSelectedMass(inputElement: HTMLInputElement) {
        const inputValue = inputElement.value;
        this.selectedMass = tsEssentials.isNumeric(inputValue) ? +inputValue : 0;
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
    /**
     * generates an internal array of status-bar-field for later use.
     * @param fieldIdBeginsWith the status bar's fields' ids have the same start followed by a number (starting at 1)
     */
    public initStatusBar(statusBar: HTMLDivElement) {
        const statusBarFields = statusBar.querySelectorAll(".statusBarItem") as NodeListOf<HTMLSpanElement>;
        statusBarFields.forEach(field => {
            this.statusBar.fields.push(field);
        });
    }
}