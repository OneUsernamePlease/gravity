import { Vector2D } from "../util/vector2d.js";
import { BACKGROUND_COLOR, COORDINATE_SYSTEM_AXIS_THICKNESS, COORDINATE_SYSTEM_AXIS_COLOR, MAX_ZOOM, MIN_ZOOM, PATH_SEGMENT_MIN_LENGTH, PATH_THICKNESS, VECTOR_COLORS, VECTOR_THICKNESS } from "../const/const.js";
import { AnimationSettings, CanvasLayer, CanvasSpace, LayerName, ObjectState, PathCoordinate } from "../types/types.js";
import { Path, Paths } from "./paths.js";
import { clamp } from "../util/util.js";
import { App } from "../app/app.js";

export class Canvas {
    private _layers: Map<LayerName, CanvasLayer> = new Map();
    private _canvasSpace: CanvasSpace = {
        origin: new Vector2D(0, 0),
        currentZoom: 1
    }
    private _paths: Paths;
    private _cameraChange = true;
    
    constructor(private _canvasParent: HTMLDivElement, private _app: App) {
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

        const coordinateSystemCanvas = this.createLayer("z-20");
        this._layers.set("coordinateSystem", {
            canvas: coordinateSystemCanvas,
            context: coordinateSystemCanvas.getContext("2d")!
        })

        const simulationCanvas = this.createLayer("z-30");
        this._layers.set("simulation", {
            canvas: simulationCanvas,
            context: simulationCanvas.getContext("2d")!
        });

        const interactionCanvas = this.createLayer("z-40");
        this._layers.set("interaction", {
            canvas: interactionCanvas,
            context: interactionCanvas.getContext("2d")!
        }); 

        this.resize();
        this.setInitialTransformation();

        this._paths = new Paths();
    }
//#region get, set
    get interactionCanvas() {
        return this._layers.get("interaction")!.canvas;
    }
    get backgroundContext() {
        return this._layers.get("background")!.context;
    }
    get pathsContext() {
        return this._layers.get("paths")!.context;
    }
    get coordinateSystemContext() {
        return this._layers.get("coordinateSystem")!.context;
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
    get currentZoom(): number {
        return this._canvasSpace.currentZoom;
    }
    get origin() {
        return this._canvasSpace.origin;
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
    resize() {
        const rect = this.interactionCanvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        for (const layer of this._layers.values()) {
            layer.canvas.width = width;
            layer.canvas.height = height;
        }

        this.applyTransformation();

        this.fillBackground();

        this._cameraChange = true;
    }   
//#region View-transformations
    move(displacement: Vector2D) {
        const zoom = this._canvasSpace.currentZoom;

        this._canvasSpace.origin.x -= displacement.x * zoom;
        this._canvasSpace.origin.y -= displacement.y * zoom;

        this.applyTransformation();

        this._cameraChange = true;
    }
    zoomToFactor(factor: number, centerOnCanvas: Vector2D) {
        const oldZoom = this._canvasSpace.currentZoom;
        let newZoom = oldZoom * factor;
        newZoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
                
        this._canvasSpace.origin.x += centerOnCanvas.x * (oldZoom - newZoom);
        this._canvasSpace.origin.y += centerOnCanvas.y * (oldZoom - newZoom);
        this._canvasSpace.currentZoom = newZoom;

        this.applyTransformation();

        this._cameraChange = true;
        
        return newZoom;
    }
    /**
     * Applies canvasSpace to all layers that need to be transformed (all except background).
     */
    private applyTransformation() {
        this._layers.forEach((layer, name) => {
            if (name === "background") {
                return;
            }
            const context = layer.context;
            const zoom = this._canvasSpace.currentZoom;
            const origin = this._canvasSpace.origin;
            context.setTransform(
                1 / zoom, 0, 0,
                1 / zoom, -origin.x / zoom, -origin.y / zoom
            )
        });
    }
    private setInitialTransformation() {
        this._canvasSpace.currentZoom = 1;
        this._canvasSpace.origin = new Vector2D(- this.width / 2, - this.height / 2);
        this.applyTransformation();
    }
//#endregion
//#region drawing stuff
    drawFrame(objectStates: Map<number, ObjectState>, animationSettings: AnimationSettings) {
        // bodies
        this.clearSimulation();
        this.drawBodies(objectStates);
        
        // vectors
        if (animationSettings.displayVectors) {
            this.drawVectors(objectStates);
        }
        
        // paths
        if (animationSettings.tracePaths) {
            if (this._cameraChange) {
                this._paths.addSegments(objectStates);
                this.clearPathContext();
                this.drawPaths(this._paths);
            } else {
                const previousState = this._paths.pathEnds;
                this.drawPathSegments(previousState, objectStates)
                this._paths.addSegments(objectStates);
            }
        }
        
        // coordinate system
        if (animationSettings.displayCoordinateSystem) {
            if (this._cameraChange) {
                this.clearCoordinateSystem();
                this.drawCoordinateSystem();
            }
        }

        this._cameraChange = false;
    }
    drawCoordinateSystem(context = this.coordinateSystemContext) {
        const origin  = this._canvasSpace.origin;
        const zoom = this._canvasSpace.currentZoom;

        const xAxisLength = this.width * zoom;
        const yAxisLength = this.height * zoom;
        this.drawLine(
            new Vector2D(0, origin.y),
            new Vector2D(0, yAxisLength),
            COORDINATE_SYSTEM_AXIS_COLOR,
            COORDINATE_SYSTEM_AXIS_THICKNESS,
            context
        );
        this.drawLine(
            new Vector2D(origin.x, 0),
            new Vector2D(xAxisLength, 0),
            COORDINATE_SYSTEM_AXIS_COLOR,
            COORDINATE_SYSTEM_AXIS_THICKNESS,
            context
        )

        // context.fillStyle = COORDINATE_SYSTEM_COLOR;
        // context.font = `${11*zoom}px sans-serif`;
        // context.fillText(`(0,0)`, 0, 0)
    }
    private drawBodies(objectStates: Map<number, ObjectState>) {
        objectStates.forEach(objectState => {
            const body = objectState.body;
            this.drawCircle(objectState.position, body.radius, body.color);
        });
    }
    private drawVectors(objectStates: Map<number, ObjectState>) {
        objectStates.forEach(objectState => {
            const position = objectState.position;
            const acceleration = objectState.acceleration;
            const velocity = objectState.velocity;

            this.drawLine(position, acceleration, VECTOR_COLORS.get("acceleration")?.hex, VECTOR_THICKNESS);
            this.drawLine(position, velocity, VECTOR_COLORS.get("velocity")?.hex, VECTOR_THICKNESS);
        });
    }
    private clear(context: CanvasRenderingContext2D) {
        context.save();
        context.resetTransform();
        context.clearRect(0, 0, this.width, this.height);
        context.restore();
    }
    clearSimulation() {
        this.clear(this.simulationContext);
    }
    clearCoordinateSystem() {
        this.clear(this.coordinateSystemContext);
    }
    clearPathContext() {
        this.clear(this.pathsContext);
    }
    resetPaths() {
        this.clearPathContext();
        this._paths.reset();
    }
    fillBackground(
        color: string = BACKGROUND_COLOR
    ) {
        this.backgroundContext.fillStyle = color;
        this.backgroundContext.fillRect(0, 0, this.width, this.height);
    }
    /**
     * @param position in simulation
     * @param direction in simulation
     */
    drawLine(position: Vector2D, direction: Vector2D, color = "white", lineWidth = 1, context = this.simulationContext) {
        // optionally normalize the direction and scale later
        let endPosition: Vector2D = position.add(direction);
        //if (!this.isLinePotentiallyVisible(position, endPosition)) {
        //    return;
        //}
        context.beginPath();
        context.lineWidth = lineWidth * this._canvasSpace.currentZoom;
        context.strokeStyle = color;
        context.moveTo(position.x, position.y);
        context.lineTo(endPosition.x, endPosition.y);
        context.stroke();
    }
    /**
     * draws a circular body at specified position, in specified color
     * @param position in simulation
     * @param radius in simulation
     * @param color default white
     */
    drawCircle(position: Vector2D, radius: number, color: string = "white", context = this.simulationContext) {
        //if (!this.isCircleVisible(position, radius)) return;
        context.beginPath();
        context.arc(position.x, position.y, radius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = color;
        context.fill();
    }
    drawPath(path: Path, context: CanvasRenderingContext2D) {
        if (path.length < 2) {
            return;
        }

        let batchStartIndex = 0;

        for (let i = 1; i < path.length; i++) {
            const colorChanged = path[i].color !== path[i - 1].color;

            if (colorChanged) {
                this.drawPathSegmentBatch(path, batchStartIndex, i, path[batchStartIndex].color, context);

                batchStartIndex = i;
            }
        }

        this.drawPathSegmentBatch(path, batchStartIndex, path.length - 1, path[batchStartIndex].color, context);
    }
    drawPaths(paths: Paths, context = this.pathsContext) {
        paths.forEach((path) => {
            this.drawPath(path, context);
        });
    }
    /**
     * a path segment batch is a continuous part of a path that has one color
     */
    drawPathSegmentBatch(path: Path, fromIndex: number, toIndex: number, color: string, context: CanvasRenderingContext2D) {
        if (!path[fromIndex] || !path[toIndex]) {
            throw new Error("drawPathSegmentBatch - batch indices are outside the path");            
        }

        context.strokeStyle = color;
        context.lineWidth = PATH_THICKNESS * this._canvasSpace.currentZoom;

        context.beginPath();
        context.moveTo(path[fromIndex].coordinate.x, path[fromIndex].coordinate.y);
        for (let i = fromIndex + 1; i <= toIndex; i++) {
            const pathCoordinate = path[i].coordinate;
            context.lineTo(pathCoordinate.x, pathCoordinate.y);
        }
        context.stroke();
    }
    drawPathSegment(from: Vector2D, to: Vector2D, color: string, context: CanvasRenderingContext2D) {
        context.strokeStyle = color;
        context.lineWidth = PATH_THICKNESS * this._canvasSpace.currentZoom;

        context.beginPath();

        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y)
        context.stroke();
    }
    /**
     * Draw one segment from each path.
     * @param from a map containing the starting positions of many path-segments
     * @param to a map containing the destination positions of many path-segments
     * @param context CanvasRenderingContext2d to draw onto
     */
    drawPathSegments(from: Map<number, PathCoordinate>, to: Map<number, ObjectState>, context = this.pathsContext) {
        from.forEach((fromState, id) => {
            const toState = to.get(id);
            if (!toState) {
                return;
            }

            const fromPosition = fromState.coordinate;
            const toPosition = toState.position;
            if (!fromPosition.equals(toPosition, PATH_SEGMENT_MIN_LENGTH)) {
                this.drawPathSegment(fromPosition, toPosition, fromState.color, context);
            }
        });
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