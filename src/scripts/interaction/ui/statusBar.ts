import { VECTOR_COLORS } from "../../const/const.js";
import { PerformanceInfo, StatusBarFieldType } from "../../types/types.js";
import { UI } from "./ui.js";

export class StatusBar {
    bar: HTMLDivElement
    fields: Map<StatusBarFieldType, HTMLSpanElement> = new Map();

    constructor(private ui: UI, ...fields: StatusBarFieldType[]) {
        this.bar = document.getElementById("statusBar")! as HTMLDivElement;
        fields.forEach((name) => {
            const span = document.createElement("span");
            span.classList.add("px-2");
            this.bar.appendChild(span);
            this.fields.set(name, span);
        });
        this.setInitialMessages();
    }
    setInitialMessages() {
        const element = this.fields.get("Zoom");
        if (element) {
            element.innerHTML = `Zoom: ${this.ui.zoom.toFixed(2)} (m/px)`;
        }
    }
    private clearMessage(field: StatusBarFieldType) {
        this.setStatusMessage("", field);
    }
    private hideField(field: StatusBarFieldType) {
        const element = this.fields.get(field);
        element?.classList.add('hidden');
    }
    private showField(field: StatusBarFieldType) {
        const element = this.fields.get(field);
        element?.classList.remove('hidden');
    }
    displayVectorMessage(display: boolean) {
        if (display) {
            this.showField("VectorInfo");
            this.setStatusMessage(this.vectorMessage(), "VectorInfo");
        } else {
            this.clearMessage("VectorInfo");
            this.hideField("VectorInfo");
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
        this.setStatusMessage(`Zoom: ${currentZoom.toFixed(2)} (m/px)`, "Zoom");
    }
    updateCanvasDimensions(width: number, height: number) {
        this.setStatusMessage(`Canvas size: ${width} * ${height}`, "CanvasSize");
    }
    private updateBodyCount(bodyCount: number) {
        this.setStatusMessage(`Number of Bodies: ${bodyCount}`, "BodyCount");
    }
    private updateTickInfo( tickCount: number, performanceInfo?: PerformanceInfo ) {
        let message = `Simulation Tick: ${tickCount}`;
        message += performanceInfo?.ticksLastSecond ? `, Ticks/s: ${performanceInfo.ticksLastSecond.toFixed(1)}` : "";
        this.setStatusMessage(message, "TickInfo");
    }
    private vectorMessage() {
        return `Acceleration: ${VECTOR_COLORS.get("acceleration")?.name} - Velocity: ${VECTOR_COLORS.get("velocity")?.name}`;
    }
    /**
     * @param fieldIndexOrId number of field (starting at one) OR id of the field
     */
    private setStatusMessage(message: string, field: StatusBarFieldType, append: boolean = false) {
        const element = this.fields.get(field);
        if (!element) return;
        

        if (append) {
            element!.innerHTML += message;
        } else {
            element!.innerHTML = message;
        }
    }
}
