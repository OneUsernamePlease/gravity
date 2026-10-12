import { MenuItem, PerformanceInfo } from "@/types/types.js";
import { Vector2D } from "@/util/vector2d.js";
import { Popover } from "@/ui/popover.js";

export type Status = {
    zoom?: number;
    bodyCount?: number;
    canvasSize?: {
        width: number;
        height: number;
    };
    ticks?: number;
    performance?: PerformanceInfo;
};

export class StatusStore {
    private status: Status = {};
    private subscribers = new Set<(status: Status) => void>();
    subscribe(callback: (status: Status) => void) {
        this.subscribers.add(callback);

        callback(this.status);

        return () => {
            this.subscribers.delete(callback);
        };
    }
    private setState(update: Status) {
        Object.assign(this.status, update);

        for (const subscriber of this.subscribers) {
            subscriber(this.status);
        }
    }
    setZoom(zoom: number) {
        this.setState({ zoom });
    }
    setBodyCount(bodyCount: number) {
        this.setState({ bodyCount });
    }
    setCanvasSize(width: number, height: number) {
        this.setState({
            canvasSize: { width, height },
        });
    }
    setTickInfo(tickCount: number) {
        this.setState({
            ticks: tickCount,
        });
    }
    setPerformance(performance: PerformanceInfo) {
        this.setState({
            performance: { ticksLastSecond: performance.ticksLastSecond }
        });
    }
}
type StatusBarField = "BodyCount" | "Ticks" | "Performance" | "Zoom" | "CanvasSize";
const statusBarFields: Record<StatusBarField, { name: string, position: number }> = {
    "BodyCount": { name: "Number of Bodies", position: 1},
    "Ticks": { name: "Ticks", position: 2},
    "Performance": { name: "Performance", position: 3},
    "Zoom": { name: "Zoom", position: 4},
    "CanvasSize": { name: "Size", position: 5}
}
export class StatusBar {
    private readonly bar: HTMLDivElement;
    private readonly fields = new Map<StatusBarField, HTMLSpanElement>();
    private readonly popover = new Popover({ alignment: "top" });
    private readonly unsubscribe: () => void;

    constructor(private readonly status: StatusStore, ...fields: (keyof typeof statusBarFields)[]) {
        this.bar = document.getElementById("statusBar") as HTMLDivElement;

        for (const field of fields) {
            this.createField(field);
        }

        this.unsubscribe = this.status.subscribe((state) => {
            this.render(state);
        });

        this.bar.addEventListener("contextmenu", (ev) => {
            this.leftClick(ev);
        });
    }
    destroy() {
        this.unsubscribe();
        this.popover.close();
    }
    toggle(...fields: (keyof typeof statusBarFields)[]) {
        for (const field of fields) {
            if (this.fields.has(field)) {
                this.removeField(field);
            } else {
                this.createField(field);
            }
        }
    }
    private createField(field: keyof typeof statusBarFields) {
        if (this.fields.has(field)) {
            return;
        }

        const span = document.createElement("span");
        span.classList.add("px-2");
        
        const position = statusBarFields[field].position;

        const spanElementBelow = Array.from(this.bar.children).find(child => {
            const existingField = this.fields.entries()
                .find(([, element]) => element === child)?.[0];

            return existingField !== undefined &&
                statusBarFields[existingField].position > position;
        });

        if (spanElementBelow !== undefined) {
            this.bar.insertBefore(span, spanElementBelow);            
        } else {
            this.bar.appendChild(span);
        }
        
        this.fields.set(field, span);
    }
    private removeField(field: keyof typeof statusBarFields) {
        const element = this.fields.get(field);
        if (!element) { return; }

        element.remove();
        this.fields.delete(field);
    }
    private isFieldVisible(field: keyof typeof statusBarFields): boolean {
        return this.fields.has(field);
    }
    private render(state: Status) {
        if (state.zoom !== undefined) {
            this.setStatusMessage(
                `Zoom: ${state.zoom.toFixed(2)} (m/px)`,
                "Zoom",
            );
        }

        if (state.bodyCount !== undefined) {
            this.setStatusMessage(
                `Bodies: ${state.bodyCount}`,
                "BodyCount",
            );
        }

        if (state.canvasSize !== undefined) {
            const { width, height } = state.canvasSize;

            this.setStatusMessage(
                `Size: ${width} * ${height}`,
                "CanvasSize",
            );
        }

        if (state.ticks !== undefined) {
            const message = `Tick: ${state.ticks}`;

            this.setStatusMessage(message, "Ticks");
        }

        if (state.performance !== undefined) {
            if (!state.performance.ticksLastSecond) return;
            
            const message = `Ticks/s: ${state.performance.ticksLastSecond.toFixed(1)}`;   
            this.setStatusMessage(message, "Performance");
        }
    }
    private setStatusMessage(
        message: string,
        field: keyof typeof statusBarFields,
    ) {
        const element = this.fields.get(field);

        if (!element) {
            return;
        }

        element.textContent = message;
    }
    leftClick(ev: MouseEvent) {
        ev.preventDefault();

        const popoverEntries = this.generateEntries();

        this.popover.open(
            new Vector2D(ev.clientX, ev.clientY),
            ...popoverEntries,
        );
    }
    closePopover() {
        this.popover.close();
    }
    private generateEntries(): MenuItem[] {
        const entries: MenuItem[] = [];

        Object.keys(statusBarFields).forEach((key) => {
            const field = key as keyof typeof statusBarFields
            entries.push({
                label: this.generateToggleEntryText(field),
                action: () => {
                    this.toggle(field);
                }
            });
        });

        return entries;
    }
    private generateToggleEntryText(field: keyof typeof statusBarFields): string {
        return `${this.isFieldVisible(field) ? "Hide" : "Show"} ${statusBarFields[field].name}`
    }
}
