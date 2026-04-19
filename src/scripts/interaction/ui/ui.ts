import * as util from "../../util/util.js";
import { UIAnimationSettings, SimulationSettings } from "../../types/types.js";
import { App } from "../../app/app.js";
import { StatusBar } from "./statusBar.js";
import { TopMenu } from "./topMenu.js";
import { ControlBar } from "./controlBar.js";

export class UI {
//#region properties
    // All UI Components
    private statusBar: StatusBar;
    private topMenu: TopMenu;
    private controlBar: ControlBar;
    
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
        this.controlBar = new ControlBar(this, this.app);
        this.statusBar = new StatusBar();
        this.topMenu = new TopMenu(this, this.app);
    }

    public initialize(width: number, height: number) {
        this.statusBar.displayVectorMessage(this.displayVectors)
        this.statusBar.updateCanvasDimensions(width, height);

        
    }
//#endregion
    public toggleControlBar() {
        this.controlBar.toggle();
    }
    public simulationStopped() {
        this.topMenu.simulationStopped();
    }
    public simulationResumed() {
        this.topMenu.simulationResumed();
        this.statusBar.updateSimulationInfo(this.app.currentTick, this.app.currentSimulationState.length);
    }

    //#region StatusBar
    public displayVectorMessage(display: boolean) {
        this.statusBar.displayVectorMessage(display);
    }
    public updateStatusBarSimulationInfo() {
        this.statusBar.updateSimulationInfo(this.app.currentTick, this.app.currentSimulationState.length)
    }
    public updateStatusBarCanvasDimensions(windowWidth: number, windowHeight: number) {
        this.statusBar.updateCanvasDimensions(windowWidth, windowHeight)
    }
    public updateStatusBarAnimationInfo() {
        this.statusBar.updateAnimationInfo(this.app.currentZoom)
    }
    //#endregion
}