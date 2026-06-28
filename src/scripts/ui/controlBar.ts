import * as util from "../util/util.js";
import { RadioButtonGroup, SimulationSettings, UIAnimationSettings } from "../types/types.js";
import { App } from "../app/app.js";
import { UI } from "./ui.js";
import { Vector2D } from "../util/vector2d.js";
import { VECTOR_COLORS } from "../const/const.js";
export class ControlBar {
    private zoomInButton: HTMLInputElement;
    private zoomOutButton: HTMLInputElement;
    private scrollUpButton: HTMLInputElement;
    private scrollDownButton: HTMLInputElement;
    private scrollLeftButton: HTMLInputElement;
    private scrollRightButton: HTMLInputElement;
    private displayVectorsCheckbox: HTMLInputElement;
    private tracePathsCheckbox: HTMLInputElement;
    private displayCoordinateSystemCheckbox: HTMLInputElement;
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
    get collisionDetection() {
        return this.collisionDetectionCheckbox.checked;
    }
    get elasticCollisions() {
        return this.elasticCollisionsCheckbox.checked;
    }
    get gravitationalConstant() {
        return util.getInputNumber(this.gravitationalConstantInput);
    }
    get displayVectors() {
        return this.displayVectorsCheckbox.checked;
    }
    get tracePaths() {
        return this.tracePathsCheckbox.checked;
    }
    get displayCoordinateSystem() {
        return this.displayCoordinateSystemCheckbox.checked;
    }
    get mass() {
        return util.getInputNumber(this.massInput);
    }
    get movable() {
        return this.movableCheckbox.checked;
    }
    get selectedClickAction() {
        return this.getSelectedValue(this.clickAction) ?? this.clickAction.buttons[0].value;
    }
    get animationSettings(): UIAnimationSettings {
        return {
            displayVectors: this.displayVectors,
            tracePaths: this.tracePaths,
            displayCoordinateSystem: this.displayCoordinateSystem
        }
    }
    get simulationSettings(): SimulationSettings {
        return {
            collisionDetection: this.collisionDetection,
            elasticCollisions: this.elasticCollisions,
            gravitationalConstant: this.gravitationalConstant,
        }
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
        this.tracePathsCheckbox                 = document.getElementById("cbxTracePaths")! as HTMLInputElement;
        this.displayCoordinateSystemCheckbox    = document.getElementById("cbxDisplayCoordinateSystem")! as HTMLInputElement;
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
        this.displayVectorsCheckbox.addEventListener("mouseenter", (ev) => this.prepareTooltipDisplayVectors(ev));
        this.displayVectorsCheckbox.labels?.forEach((label) => {
            label.addEventListener("mouseenter", (ev) => this.prepareTooltipDisplayVectors(ev));
        });
        this.tracePathsCheckbox.addEventListener("change", () => this.cbxTracePathsChanged());
        this.displayCoordinateSystemCheckbox.addEventListener("change", () => this.cbxDisplayCoordinateSystemChanged());
        this.collisionDetectionCheckbox.addEventListener("change", () => this.cbxCollisionsChanged());
        this.elasticCollisionsCheckbox.addEventListener("change", () => this.cbxCollisionsChanged());
        this.gravitationalConstantInput.addEventListener("change", () => this.numberInputGChanged());
        this.gravitationalConstantRangeInput.addEventListener("input", () => this.rangeInputGChanged());
        this.massInput.addEventListener("change", () => this.updateSelectedMass());
        this.toggleControlBarButton.addEventListener("click", () => this.toggle())
    }
    toggle() {
        this.isControlBarCollapsed = !this.isControlBarCollapsed;
        this.controlBar.classList.toggle("translate-x-full");
        this.toggleControlBarButton.textContent = this.isControlBarCollapsed ? "❮" : "❯";
    }
    expand() {
        this.isControlBarCollapsed = false;
        this.controlBar.classList.remove("translate-x-full")
        this.toggleControlBarButton.textContent = "❯";
    }
    collapse() {
        this.isControlBarCollapsed = true;
        this.controlBar.classList.add("translate-x-full")
        this.toggleControlBarButton.textContent = "❮";
    }
    getSelectedValue(group: RadioButtonGroup): string | null {
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
    numberInputGChanged() {
        const newG: string = this.gravitationalConstantInput.value;
        this.gravitationalConstantRangeInput.value = newG;
        this.app.applySimulationSettings({gravitationalConstant: Number(newG) });
    }
    rangeInputGChanged() {
        const newG: string = this.gravitationalConstantRangeInput.value;
        if (this.gravitationalConstantInput.value !== newG) {
            this.gravitationalConstantInput.value = newG;
            this.app.applySimulationSettings({gravitationalConstant: Number(newG) });
        }
    }
    updateSelectedMass() {
        this.massInput.step = this.calculateMassInputStep();
    }
    zoomInClicked() {
        this.app.zoomIn();
    }
    zoomOutClicked() {
        this.app.zoomOut();
    }
    scrollUpClicked() {
        this.app.scrollUp();
    }
    scrollDownClicked() {
        this.app.scrollDown();
    }
    scrollLeftClicked() {
        this.app.scrollLeft();
    }
    scrollRightClicked() {
        this.app.scrollRight();
    }
    cbxDisplayVectorsChanged() {
        this.app.setDisplayVectors(this.displayVectors);
    }
    prepareTooltipDisplayVectors(ev: MouseEvent) {
        const position = new Vector2D(ev.clientX, ev.clientY);
        setTimeout(() => {
            this.ui.showTooltip(position, `Acceleration: ${VECTOR_COLORS.get("acceleration")?.name} - Velocity: ${VECTOR_COLORS.get("velocity")?.name}`)
        }, 500);
    }
    cbxTracePathsChanged() {
        this.app.setTracePaths(this.tracePaths);
    }
    cbxDisplayCoordinateSystemChanged() {
        this.app.setDisplayCoordinateSystem(this.displayCoordinateSystem);
    }
    cbxCollisionsChanged() {
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
