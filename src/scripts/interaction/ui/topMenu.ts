// Basic Menu.
// Contains Buttons: Reset, Play/Pause, Next Step, To the Repository

import { App } from "../../app/app.js";
import { UI } from "./ui.js";

export class TopMenu {
    private resetButton: HTMLInputElement;
    private playPauseButton: HTMLInputElement;
    private stepButton: HTMLInputElement;
    private repositoryLink: HTMLElement;

    constructor(private ui: UI, private app: App) {
        this.resetButton        = document.getElementById("btnResetSim")! as HTMLInputElement;
        this.playPauseButton    = document.getElementById("btnToggleSim")! as HTMLInputElement;
        this.stepButton         = document.getElementById("btnNextStep")! as HTMLInputElement;
        this.repositoryLink     = document.getElementById("repoLink")!;

        this.registerEvents();
    }

    registerEvents() {
        this.resetButton.addEventListener("click", () => this.resetButtonClicked());
        this.playPauseButton.addEventListener("click", () => this.playPauseClicked());
        this.stepButton.addEventListener("click", () => this.stepButtonClicked());
    }

    public resetButtonClicked() {
        this.app.resetSimulation()
        this.ui.updateStatusBarSimulationInfo();
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
        this.ui.updateStatusBarSimulationInfo();
    }

    public simulationStopped() {
        this.playPauseButton.innerHTML = "&#9654;"; // play symbol
        this.stepButton.disabled = false;
    }
    public simulationResumed() {
        this.playPauseButton.innerHTML = "&#10074;&#10074;"; // pause symbol
        this.stepButton.disabled = true;
    }
}

