import { Vector2D } from "../util/vector2d.js";
import * as essentials from "../util/util.js";
import { BACKGROUND_COLOR, PATH_THICKNESS, VECTOR_THICKNESS } from "../const/const.js";
import { CanvasLayer, LayerName } from "../types/types.js";

export class Canvas {
    private _layers: Map<LayerName, CanvasLayer> = new Map();
    constructor(private _canvasParent: HTMLDivElement) {
        const backgroundCanvas = this.createLayer("z-0");
        this._layers.set("background", {
            canvas: backgroundCanvas,
            context: backgroundCanvas.getContext("2d", { alpha: false })!
        });
        
        const pathsCanvas = this.createLayer("z-10");
        this._layers.set("paths", {
            canvas: pathsCanvas,
            context: pathsCanvas.getContext("2d")!
        });

        const simulationCanvas = this.createLayer("z-20");
        this._layers.set("simulation", {
            canvas: simulationCanvas,
            context: simulationCanvas.getContext("2d")!
        });

        const interactionCanvas = this.createLayer("z-30");
        this._layers.set("interaction", {
            canvas: interactionCanvas,
            context: interactionCanvas.getContext("2d")!
        });
    }
//#region get, set
    get backgroundCanvas() {
        return this._layers.get("background")!.canvas;
    }
    get simulationCanvas() {
        return this._layers.get("simulation")!.canvas;
    }
    get interactionCanvas() {
        return this._layers.get("interaction")!.canvas;
    }
    get backgroundContext() {
        return this._layers.get("background")!.context;
    }
    get pathsContext() {
        return this._layers.get("paths")!.context;
    }
    get simulationContext() {
        return this._layers.get("simulation")!.context;
    }
    get interactionContext() {
        return this._layers.get("interaction")!.context;
    }
    // additional getters
    get width(): number {
        return this._layers.get("background")!.canvas.width;
    }
    get height(): number {
        return this._layers.get("background")!.canvas.height;
    }
//#endregion
    createLayer(zIndexClass: string): HTMLCanvasElement {
        if (!(/^z-0$|^z-[1-9]\d*$/.test(zIndexClass))) {
            throw new Error("zIndex has to be a valid tailwind z-value (eg. 'z-0' or 'z-123'");
        }

        const canvas = document.createElement("canvas");
        canvas.className = `absolute inset-0 w-full h-full touch-none ${zIndexClass}`;
        this._canvasParent.appendChild(canvas);

        return canvas;
    }
    resize(width: number, height: number) {
        for (const layer of this._layers.values()) {
            layer.canvas.width = width;
            layer.canvas.height = height;
        }

        this.fillBackground();
    }   
//#region drawing stuff
    private clear(context: CanvasRenderingContext2D) {
        context.clearRect(0, 0, this.width, this.height);
    }
    clearAll() {
        for (const layer of this._layers.values()) {
            this.clear(layer.context);
        }
    }
    clearSimulation() {
        this.clear(this.simulationContext);
    }
    clearPaths() {
        this.clear(this.pathsContext);
    }
    fillBackground(
        color: string = BACKGROUND_COLOR
    ) {
        this.backgroundContext.fillStyle = color;
        this.backgroundContext.fillRect(0, 0, this.width, this.height);
    }
    /**
     * @param position in canvas space
     * @param direction in canvas space
     */
    drawVector(position: Vector2D, direction: Vector2D, color = "white", context = this.simulationContext) {
        // optionally normalize the direction and scale later
        let endPosition: Vector2D = position.add(direction);
        if (!this.isLinePotentiallyVisible(position, endPosition)) {
            return;
        }
        context.beginPath();
        context.lineWidth = VECTOR_THICKNESS;
        context.strokeStyle = color;
        context.moveTo(position.x, position.y);
        context.lineTo(endPosition.x, endPosition.y);
        context.stroke();
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param position on canvas
     * @param radius in canvas units
     * @param color default white
     */
    drawBody(position: Vector2D, radius: number, color: string = "white", context = this.simulationContext) {
        if (!this.isCircleVisible(position, radius)) return;
        context.beginPath();
        context.arc(position.x, position.y, radius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = color;
        context.fill();

    }
    drawPaths(paths: Vector2D[][]) {
        paths.forEach((path) => {
            this.drawPath(path);
        });
    }
    drawPath(path: Vector2D[], color = "orange", context = this.pathsContext) {
        if (path.length <= 1) return;

        context.strokeStyle = color;
        context.lineWidth = PATH_THICKNESS;
        
        context.beginPath();

        let drawing = false;

        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            const visible = this.isOnscreen(p.x, p.y);

            if (visible) {
                if (!drawing) {
                    context.moveTo(p.x, p.y);
                    drawing = true;
                } else {
                    context.lineTo(p.x, p.y);
                }
            } else {
                drawing = false;
            }
        }

        context.stroke();
    }
    drawPathSegment(from: Vector2D, to: Vector2D, color: string, context = this.pathsContext) {
        context.strokeStyle = color;
        context.lineWidth = PATH_THICKNESS;

        context.beginPath();

        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y)
        context.stroke();
    }
    resetPaths(context = this.pathsContext) {
        this.clear(context);
    }
    /**
     * @param position
     * Whether position (in the canvas coordinate-system) is visible on the canvas.
     */
    private isOnscreen(x: number, y: number): boolean {
        const inBoundsLeft      = x >= 0;
        const inBoundsRight     = x <= this.width;
        const inBoundsTop       = y >= 0;
        const inBoundsBottom    = y <= this.height;
        return inBoundsLeft && inBoundsRight && inBoundsTop && inBoundsBottom;
    }
    private isCircleVisible(position: Vector2D, radius: number): boolean {
        const inBoundsLeft = position.x + radius >= 0;
        const inBoundsRight = position.x - radius <= this.width;
        const inBoundsTop = position.y + radius >= 0;
        const inBoundsBottom = position.y - radius <= this.height;
        return inBoundsLeft && inBoundsRight && inBoundsTop && inBoundsBottom;
    }
    private isLinePotentiallyVisible(startPoint: Vector2D, endPoint: Vector2D) :boolean {
        const minX = startPoint.x < endPoint.x ? startPoint.x : endPoint.x;
        const maxX = startPoint.x > endPoint.x ? startPoint.x : endPoint.x;
        const minY = startPoint.y < endPoint.y ? startPoint.y : endPoint.y;
        const maxY = startPoint.y > endPoint.y ? startPoint.y : endPoint.y;

        return !(maxX < 0 || minX > this.width || maxY < 0 || minY > this.height);
    }
//#endregion
}