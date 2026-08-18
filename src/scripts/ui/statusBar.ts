import { MenuItem, PerformanceInfo, StatusBarFieldType } from "@/types/types.js";
import { Vector2D } from "@/util/vector2d.js";
import { Popover } from "@/ui/popover.js";

export type Status = {
    zoom?: number;
    bodyCount?: number;
    canvasSize?: {
        width: number;
        height: number;
    };
    tickInfo?: {
        tickCount: number;
        performanceInfo?: PerformanceInfo;
    };
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
    setTickInfo(tickCount: number, performanceInfo?: PerformanceInfo) {
        this.setState({
            tickInfo: {
                tickCount,
                performanceInfo,
            },
        });
    }
}

export class StatusBar {
    private readonly bar: HTMLDivElement;
    private readonly fields = new Map<StatusBarFieldType, HTMLSpanElement>();
    private readonly popover = new Popover({ alignment: "top" });
    private readonly unsubscribe: () => void;

    constructor(private readonly status: StatusStore, ...fields: StatusBarFieldType[]) {
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
    private createField(field: StatusBarFieldType) {
        if (this.fields.has(field)) {
            return;
        }

        const span = document.createElement("span");
        span.classList.add("px-2");

        this.bar.appendChild(span);
        this.fields.set(field, span);
    }
    private removeField(field: StatusBarFieldType) {
        const element = this.fields.get(field);
        if (!element) { return; }

        element.remove();
        this.fields.delete(field);
    }
    toggle(...fields: StatusBarFieldType[]) {
        for (const field of fields) {
            if (this.fields.has(field)) {
                this.removeField(field);
            } else {
                this.createField(field);
            }
        }
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

        if (state.tickInfo !== undefined) {
            const { tickCount, performanceInfo } = state.tickInfo;

            let message = `Simulation Tick: ${tickCount}`;

            if (performanceInfo?.ticksLastSecond !== undefined) {
                message += `, Ticks/s: ${performanceInfo.ticksLastSecond.toFixed(1)}`;
            }

            this.setStatusMessage(message, "TickInfo");
        }
    }
    private setStatusMessage(
        message: string,
        field: StatusBarFieldType,
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
        return [
            {
                label: "Do Nothing",
                action: () => {},
            },
        ];
    }
}
