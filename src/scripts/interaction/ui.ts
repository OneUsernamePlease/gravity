import * as util from "../util/util";
import { RadioButtonGroup, StatusBar, UIAnimationSettings, SimulationSettings } from "../types/types";
import { App } from "../app/app";
import { VECTOR_COLORS } from "../const/const";

export class UI {
//#region properties
    // All UI Elements
    private statusBar: StatusBar;
    private resetButton: HTMLInputElement;
    private playPauseButton: HTMLInputElement;
    private stepButton: HTMLInputElement;
    private repositoryLink: HTMLElement;
    private zoomInButton: HTMLInputElement;
    private zoomOutButton: HTMLInputElement;
    private scrollUpButton: HTMLInputElement;
    private scrollDownButton: HTMLInputElement;
    private scrollLeftButton: HTMLInputElement;
    private scrollRightButton: HTMLInputElement;
    private displayVectorsCheckbox: HTMLInputElement;
    private collisionDetectionCheckbox: HTMLInputElement;
    private elasticCollisionsCheckbox: HTMLInputElement;
    private gravitationalConstantInput: HTMLInputElement;
    private gravitationalConstantRangeInput: HTMLInputElement;
    private clickAction: RadioButtonGroup;
    private massInput: HTMLInputElement;
    private movableCheckbox: HTMLInputElement;
//#endregion
//#region get, set
    // get all the values
    private get collisionDetection() {
        return this.collisionDetectionCheckbox.checked;
    }
    private get elasticCollisions() {
        return this.elasticCollisionsCheckbox.checked;
    }
    private get gravitationalConstant() {
        return util.getInputNumber(this.gravitationalConstantInput);
    }
    private get displayVectors() {
        return this.displayVectorsCheckbox.checked;
    }
    private get mass() {
        return util.getInputNumber(this.massInput);
    }
    private get movable() {
        return this.movableCheckbox.checked;
    }
    get selectedClickAction() {
        return this.getSelectedValue(this.clickAction) ?? this.clickAction.buttons[0].value;
    }
    get animationSettings(): UIAnimationSettings {
        return {
            displayVectors: this.displayVectors,
        };
    }
    get simulationSettings(): SimulationSettings {
        return {
            collisionDetection: this.collisionDetection,
            elasticCollisions: this.elasticCollisions,
            gravitationalConstant: this.gravitationalConstant,
        };
    }
    get bodyInformation() {
        return {
            mass: this.mass,
            movable: this.movable,
        }
    }
//#endregion
//#region initialize
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
        this.movableCheckbox                    = document.getElementById("cbxBodyMovable")! as HTMLInputElement;
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
    private registerEvents() {
        this.resetButton.addEventListener("click", () => this.resetButtonClicked());
        this.playPauseButton.addEventListener("click", () => this.playPauseClicked());
        this.stepButton.addEventListener("click", () => this.stepButtonClicked());
        this.zoomInButton.addEventListener("click", () => this.zoomInClicked());
        this.zoomOutButton.addEventListener("click", () => this.zoomOutClicked());
        this.scrollUpButton.addEventListener("click", () => this.scrollUpClicked());
        this.scrollDownButton.addEventListener("click", () => this.scrollDownClicked());
        this.scrollLeftButton.addEventListener("click", () => this.scrollLeftClicked());
        this.scrollRightButton.addEventListener("click", () => this.scrollRightClicked());
        this.displayVectorsCheckbox.addEventListener("change", () => this.cbxDisplayVectorsChanged());
        this.collisionDetectionCheckbox.addEventListener("change", () => this.cbxCollisionsChanged());
        this.elasticCollisionsCheckbox.addEventListener("change", () => this.cbxCollisionsChanged());
        this.gravitationalConstantInput.addEventListener("change", () => this.numberInputGChanged());
        this.gravitationalConstantRangeInput.addEventListener("input", () => this.rangeInputGChanged());
        this.massInput.addEventListener("change", () => this.updateSelectedMass());
    }
    public initialize(width: number, height: number) {
        this.elasticCollisionsCheckbox.disabled = !this.collisionDetectionCheckbox.checked;
        this.massInput.step = this.calculateMassInputStep();
        
        this.setStatusBarVectors()
        
        this.updateStatusBarCanvasDimensions(width, height);

        this.app.applySimulationSettings({gravitationalConstant: Number(this.gravitationalConstantRangeInput.value)})
    }
//#endregion
    public resetButtonClicked() {
        this.app.resetSimulation()
        this.updateStatusBarSimulationInfo();
    }
    public playPauseClicked() {
        if (this.app.simulationRunning) {
            this.app.stop();
        } else {
            this.app.run();
        }
    }
    public stepButtonClicked() {
        this.app.advanceOneTick();
        this.updateStatusBarSimulationInfo();
    }
    public zoomInClicked() {
        this.app.zoomIn();
        this.updateStatusBarAnimationInfo();
    }
    public zoomOutClicked() {
        this.app.zoomOut();
        this.updateStatusBarAnimationInfo();
    }
    public scrollUpClicked() {
        this.app.scrollUp();
    }
    public scrollDownClicked() {
        this.app.scrollDown();
    }
    public scrollLeftClicked() {
        this.app.scrollLeft();
    }
    public scrollRightClicked() {
        this.app.scrollRight();
    }
    public cbxDisplayVectorsChanged() {
        this.app.setDisplayVectors(this.displayVectors)
        this.setStatusBarVectors();
    }
    public cbxCollisionsChanged() {
        const checked = this.collisionDetectionCheckbox.checked;
        const elasticChecked = this.elasticCollisionsCheckbox.checked;
        
        this.elasticCollisionsCheckbox.disabled = !checked;
        
        const simulationSettings: SimulationSettings = {
            collisionDetection: checked,
            elasticCollisions: elasticChecked,
        }

        this.app.applySimulationSettings(simulationSettings);
    }
    public numberInputGChanged() {
        const newG: string = this.gravitationalConstantInput.value;
        this.gravitationalConstantRangeInput.value = newG;
        this.app.applySimulationSettings({gravitationalConstant: Number(newG) });
    }
    public rangeInputGChanged() {
        const newG: string = this.gravitationalConstantRangeInput.value;
        if (this.gravitationalConstantInput.value !== newG) {
            this.gravitationalConstantInput.value = newG;
            this.app.applySimulationSettings({gravitationalConstant: Number(newG) });
        }
    }
    public simulationStopped() {
        this.playPauseButton.innerHTML = "&#9654;"; // play symbol
        this.stepButton.disabled = false;
    }
    public simulationResumed() {
        this.playPauseButton.innerHTML = "&#10074;&#10074;"; // pause symbol
        
        this.stepButton.disabled = true;
        this.updateStatusBarSimulationInfo();
    }
    public getSelectedValue(group: RadioButtonGroup): string | null {
        const selected = group.buttons.find(btn => btn.checked);
        return selected?.value ?? null;
    }
    public updateSelectedMass() {
        this.massInput.step = this.calculateMassInputStep();
    }
    /**
     * The step is equal to 10% of the input value, rounded down to the nearest power of 10.
     * @returns Step as a string. Step is always at least 1 or larger.
     */
    private calculateMassInputStep(): string {
        let step = 10 ** (Math.floor(Math.log10(this.mass)) - 1);
        return step < 1 ? "1" : step.toString();
    }
    private setStatusBarVectors() {
        if (this.displayVectors) {
            this.setStatusMessage(this.statusBarVectorMessage(), 3);
        } else {
            this.setStatusMessage("", 3);
        }
    }
    public updateStatusBarSimulationInfo() {
        this.updateStatusBarTickCount(this.app.tick);
        this.updateStatusBarBodyCount(this.app.currentSimulationState.length);
    }
    public updateStatusBarAnimationInfo() {
        this.updateStatusBarZoom(this.app.currentZoom);
    }
    public updateStatusBarBodyCount(bodyCount: number, statusBarFieldIndex: number = 1) {
        this.setStatusMessage(`Number of Bodies: ${bodyCount}`, statusBarFieldIndex);
    }
    public updateStatusBarTickCount(tickCount: number, statusBarFieldIndex: number = 2) {
        this.setStatusMessage(`Simulation Tick: ${tickCount}`, statusBarFieldIndex);
    }
    public updateStatusBarZoom(currentZoom: number, statusBarFieldIndex: number = 4) {
        this.setStatusMessage(`Zoom: ${currentZoom.toFixed(2)} (m per pixel)`, statusBarFieldIndex);
    }
    public updateStatusBarCanvasDimensions(width: number, height: number, statusBarFieldIndex: number = 5) {
        this.setStatusMessage(`Canvas dimension: ${width} * ${height}`, statusBarFieldIndex);
    }
    private statusBarVectorMessage() {
        return `Acceleration: ${VECTOR_COLORS.get("acceleration")?.name} - Velocity: ${VECTOR_COLORS.get("velocity")?.name}`;
    }
    /**
     * @param fieldIndexOrId number of field (starting at one) OR id of the field
     */
    private setStatusMessage(message: string, fieldIndexOrId?: number | string, append: boolean = false) {
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