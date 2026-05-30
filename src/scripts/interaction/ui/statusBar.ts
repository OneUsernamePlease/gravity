import { VECTOR_COLORS } from "../../const/const.js";
import { PerformanceInfo } from "../../types/types.js";

export class StatusBar {
    bar: HTMLDivElement
    fields: HTMLSpanElement[];

    constructor() {
        this.bar    = document.getElementById("statusBar")! as HTMLDivElement;
        this.fields = Array.from((this.bar.querySelectorAll("span")) as NodeListOf<HTMLSpanElement>);
    }

    displayVectorMessage(display: boolean) {
        if (display) {
            this.setStatusMessage(this.vectorMessage(), 3);
        } else {
            this.setStatusMessage("", 3);
        }
    }
    updateSimulationInfo(tick: number, bodyCount: number, performanceInfo?: PerformanceInfo) {
        this.updateTickInfo(tick, performanceInfo);
        this.updateBodyCount(bodyCount);
    }
    updateAnimationInfo(zoom: number) {
        this.updateZoom(zoom);
    }
    updateZoom(currentZoom: number) {
        const statusBarFieldIndex = 4;
        this.setStatusMessage(`Zoom: ${currentZoom.toFixed(2)} (m per pixel)`, statusBarFieldIndex);
    }
    updateCanvasDimensions(width: number, height: number) {
        const statusBarFieldIndex = 5;
        this.setStatusMessage(`Canvas dimension: ${width} * ${height}`, statusBarFieldIndex);
    }
    private updateBodyCount(bodyCount: number) {
        const statusBarFieldIndex = 1;
        this.setStatusMessage(`Number of Bodies: ${bodyCount}`, statusBarFieldIndex);
    }
    private updateTickInfo( tickCount: number, performanceInfo?: PerformanceInfo ) {
        const statusBarFieldIndex = 2;
        let message = `Simulation Tick: ${tickCount}`;
        message += performanceInfo?.ticksLastSecond ? `, Ticks last s: ${performanceInfo.ticksLastSecond.toFixed(1)}` : "";
        this.setStatusMessage(message, statusBarFieldIndex);
    }
    private vectorMessage() {
        return `Acceleration: ${VECTOR_COLORS.get("acceleration")?.name} - Velocity: ${VECTOR_COLORS.get("velocity")?.name}`;
    }
    /**
     * @param fieldIndexOrId number of field (starting at one) OR id of the field
     */
    private setStatusMessage(message: string, fieldIndexOrId?: number | string, append: boolean = false) {
        let element: HTMLElement;
        if (typeof fieldIndexOrId === "number") {
            element = this.fields[fieldIndexOrId - 1];
        } else if (typeof fieldIndexOrId === "string") {
            element = document.getElementById(fieldIndexOrId)!;
        } else {
            element = this.fields[0];
        }
        
        if (append) {
            element!.innerHTML += message;
        } else {
            element!.innerHTML = message;
        }
    }
}