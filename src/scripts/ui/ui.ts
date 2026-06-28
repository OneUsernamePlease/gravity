import { UIAnimationSettings, SimulationSettings } from "../types/types.js";
import { App } from "../app/app.js";
import { StatusBar } from "./statusBar.js";
import { TopMenu } from "./topMenu.js";
import { ControlBar } from "./controlBar.js";
import { Tooltip } from "./tooltip.js";
import { Vector2D } from "../util/vector2d.js";

export class UI {
//#region properties
    // All UI Components
    private statusBar: StatusBar;
    private topMenu: TopMenu;
    private controlBar: ControlBar;
    private tooltip: Tooltip = new Tooltip();
//#endregion
//#region get, set
    // get all the values
    private get collisionDetection() {
        return this.controlBar.collisionDetection;
    }
    private get elasticCollisions() {
        return this.controlBar.elasticCollisions;
    }
    private get gravitationalConstant() {
        return this.controlBar.gravitationalConstant;
    }
    private get displayVectors() {
        return this.controlBar.displayVectors;
    }
    private get tracePaths() {
        return this.controlBar.tracePaths;
    }
    private get displayCoordinateSystem() {
        return this.controlBar.displayCoordinateSystem;
    }
    private get mass() {
        return this.controlBar.mass;
    }
    private get movable() {
        return this.controlBar.movable;
    }
    get selectedClickAction() {
        return this.controlBar.selectedClickAction;
    }
    get animationSettings(): UIAnimationSettings {
        return {
            displayVectors: this.displayVectors,
            tracePaths: this.tracePaths,
            displayCoordinateSystem: this.displayCoordinateSystem,
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
    get zoom() {
        return this.app.currentZoom;
    }
//#endregion
//#region initialize
    constructor(private app: App) {
        this.controlBar = new ControlBar(this, this.app);
        this.statusBar = new StatusBar(this, "BodyCount", "TickInfo", "Zoom", "CanvasSize");
        this.topMenu = new TopMenu(this, this.app);

        document.addEventListener("mousemove", () => { this.hideTooltip(); })
        document.addEventListener("mousedown", () => { this.hideTooltip(); })
    }

    initialize(width: number, height: number) {
        this.statusBar.updateCanvasDimensions(width, height);

        const isNarrow = window.matchMedia("(max-width: 768px)").matches;
        if (isNarrow) {
            this.controlBar.collapse();
        }
    }
//#endregion
    toggleControlBar() {
        this.controlBar.toggle();
    }
    simulationStopped() {
        this.topMenu.simulationStopped();
    }
    simulationResumed() {
        this.topMenu.simulationResumed();
    }
    showTooltip(position: Vector2D, message: string) {
        this.tooltip.open(position, message);
    }
    hideTooltip() {
        if (this.tooltip.isOpen) {
            this.tooltip.close();
        }
    }
//#region StatusBar
    updateStatusBarSimulationInfo() {
        this.statusBar.updateSimulationInfo(this.app.currentTick, this.app.currentSimulationState.size, this.app.simulationMetrics);
    }
    updateStatusBarCanvasDimensions(windowWidth: number, windowHeight: number) {
        this.statusBar.updateCanvasDimensions(windowWidth, windowHeight)
    }
    updateStatusBarAnimationInfo() {
        this.statusBar.updateAnimationInfo(this.app.currentZoom)
    }
//#endregion
}