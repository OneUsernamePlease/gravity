import * as util from "../../util/util.js";

// Controlling the simulation.
// Contains controls for:
//  View, Animation, Physics, Tools

import { RadioButtonGroup, SimulationSettings, UIAnimationSettings } from "../../types/types.js";
import { App } from "../../app/app.js";
import { UI } from "./ui.js";

export class ControlBar {
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
    private controlBar: HTMLDivElement;
    private toggleControlBarButton: HTMLButtonElement;
    // --- non UI-Element properties ---
    private isControlBarCollapsed: boolean = false;

//#region get, set
    // get all the values
    public get collisionDetection() {
        return this.collisionDetectionCheckbox.checked;
    }
    public get elasticCollisions() {
        return this.elasticCollisionsCheckbox.checked;
    }
    public get gravitationalConstant() {
        return util.getInputNumber(this.gravitationalConstantInput);
    }
    public get displayVectors() {
        return this.displayVectorsCheckbox.checked;
    }
    public get mass() {
        return util.getInputNumber(this.massInput);
    }
    public get movable() {
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
    
    constructor(private ui: UI, private app: App) {
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
        this.controlBar                         = document.getElementById("controlBar")! as HTMLDivElement;
        this.toggleControlBarButton             = document.getElementById("toggleControlBarBtn")! as HTMLButtonElement;
        this.clickAction = {
            name: "radioBtnMouseAction",
            buttons: Array.from(document.querySelectorAll('input[name="radioBtnMouseAction"]')) as HTMLInputElement[]
        };

        this.elasticCollisionsCheckbox.disabled = !this.collisionDetectionCheckbox.checked;

        this.massInput.step = this.calculateMassInputStep();
        this.app.applySimulationSettings({gravitationalConstant: Number(this.gravitationalConstantRangeInput.value)});
        this.registerEvents();

    }

    private registerEvents() {
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
        this.toggleControlBarButton.addEventListener("click", () => this.toggle())
    }
    
    public toggle() {
        this.isControlBarCollapsed = !this.isControlBarCollapsed;
        this.controlBar.classList.toggle("translate-x-full");
        this.toggleControlBarButton.textContent = this.isControlBarCollapsed ? "❮" : "❯";
    }
    public getSelectedValue(group: RadioButtonGroup): string | null {
        const selected = group.buttons.find(btn => btn.checked);
        return selected?.value ?? null;
    }
    /**
     * The step is equal to 10% of the input value, rounded down to the nearest power of 10.
     * @returns Step as a string. Step is always at least 1 or larger.
     */
    private calculateMassInputStep(): string {
        let step = 10 ** (Math.floor(Math.log10(this.mass)) - 1);
        return step < 1 ? "1" : step.toString();
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
    public updateSelectedMass() {
        this.massInput.step = this.calculateMassInputStep();
    }
    public zoomInClicked() {
        this.app.zoomIn();
    }
    public zoomOutClicked() {
        this.app.zoomOut();
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
        this.app.setDisplayVectors(this.displayVectors);
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
}
