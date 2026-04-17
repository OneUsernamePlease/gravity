// Status Bar at the bottom. Display some data using text.
// Contains: Span-Elements with text

import { VECTOR_COLORS } from "../../const/const.js";

export class StatusBar {
    public bar: HTMLDivElement
    public fields: HTMLSpanElement[];

    constructor(barElementId: string) {
        this.bar = document.getElementById(barElementId)! as HTMLDivElement;
        this.fields = Array.from((this.bar.querySelectorAll("span")) as NodeListOf<HTMLSpanElement>);
    }


    public displayVectorMessage(display: boolean) {
        if (display) {
            this.setStatusMessage(this.vectorMessage(), 3);
        } else {
            this.setStatusMessage("", 3);
        }
    }
    public updateSimulationInfo(tick: number, bodyCount: number) {
        this.updateTickCount(tick);
        this.updateBodyCount(bodyCount);
    }
    public updateAnimationInfo(zoom: number) {
        this.updateZoom(zoom);
    }
    private updateBodyCount(bodyCount: number, statusBarFieldIndex: number = 1) {
        this.setStatusMessage(`Number of Bodies: ${bodyCount}`, statusBarFieldIndex);
    }
    private updateTickCount(tickCount: number, statusBarFieldIndex: number = 2) {
        this.setStatusMessage(`Simulation Tick: ${tickCount}`, statusBarFieldIndex);
    }
    public updateZoom(currentZoom: number, statusBarFieldIndex: number = 4) {
        this.setStatusMessage(`Zoom: ${currentZoom.toFixed(2)} (m per pixel)`, statusBarFieldIndex);
    }
    public updateCanvasDimensions(width: number, height: number, statusBarFieldIndex: number = 5) {
        this.setStatusMessage(`Canvas dimension: ${width} * ${height}`, statusBarFieldIndex);
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