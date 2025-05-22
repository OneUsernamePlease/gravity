import { Body2d } from "./gravity";
import * as tsEssentials from "./essentials";
import { MASS_INPUT_ID } from "../const";

export class Inputs {
    private _selectedMass: number;
    //#region get, set
    public get selectedMass() {
        return this._selectedMass;
    }
    public set selectedMass(inputValue: number) {
        this._selectedMass = inputValue;
    }
    //#endregion
    constructor() {
        this._selectedMass = tsEssentials.getInputNumber(MASS_INPUT_ID);

        (<HTMLInputElement>document.getElementById(MASS_INPUT_ID)!).step = this.calculateMassInputStep();
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
    public calculateMassInputStep(): string {
        let step = (10 ** (Math.floor(Math.log10(this.selectedMass)) - 1));
        return step < 1 ? "1" : step.toString();
    }
}