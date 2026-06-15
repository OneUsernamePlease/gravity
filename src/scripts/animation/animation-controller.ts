import { DEFAULT_SCROLL_RATE } from "../const/const.js";
import { Canvas } from "./canvas.js";
import { AnimationSettings, UIAnimationSettings } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import { App } from "../app/app.js";

export class AnimationController {
    private _animationSettings: AnimationSettings;
    private _running: boolean;
//#region some getter
    get currentZoom(): number {
        return this._canvas.currentZoom;
    }
    get width(): number {
        return this._canvas.width;
    }
    get height(): number {
        return this._canvas.height;
    }
//#endregion
    constructor(
        private _canvas: Canvas, 
        private _app: App,
    ) {
        this._animationSettings = { frameLength: 25, displayVectors: true, tracePaths: true, displayCoordinateSystem: true };
        this._running = false;
    }
    initialize(animationSettings: UIAnimationSettings) {
        this._animationSettings.displayVectors = animationSettings.displayVectors;
        this._animationSettings.tracePaths = animationSettings.tracePaths;
        this._animationSettings.displayCoordinateSystem = animationSettings.displayCoordinateSystem;
    }
    run() {
        if (this._running) {
            return;
        }
        this._running = true;
        const loop = () => {
            if (this._running) {
                setTimeout(loop, this._animationSettings.frameLength);
                this._canvas.drawFrame(this._app.currentSimulationState, this._animationSettings);
                this._app.updateStatusBarSimulationInfo();
            }
        };
        loop();
    }
    stop() {
        this._running = false;
    }
    setDisplayVectors(display: boolean) {
        this._animationSettings.displayVectors = display;
    }
    setTracePaths(tracePaths: boolean) {
        this._animationSettings.tracePaths = tracePaths;
        if (!tracePaths) {
            this.resetPaths();
        }
    }
    resetPaths() {
        this._canvas.resetPaths();
    }
    setDisplayCoordinateSystem(displayCoordinateSystem: boolean) {
        this._animationSettings.displayCoordinateSystem = displayCoordinateSystem;
        if (!displayCoordinateSystem) {
            this.resetCoordinateSystem();
        } else {
            this._canvas.redrawCoordinateSystem();
        }
    }
    resetCoordinateSystem() {
        this._canvas.clearCoordinateSystem();
    }
    resizeCanvas() {
        this._canvas.resize();
    }

    scrollRight(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal");
        }
        this._canvas.move(new Vector2D(-distance, 0));
    }
    scrollLeft(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal");
        }
        this._canvas.move(new Vector2D(distance, 0));
    }
    scrollUp(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical");
        }
        this._canvas.move(new Vector2D(0, distance));
    }
    scrollDown(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical");
        }
        this._canvas.move(new Vector2D(0, -distance));
    }
    private scrollDistance(orientation: "horizontal" | "vertical", rate: number = DEFAULT_SCROLL_RATE): number {
        switch (orientation) {
            case "horizontal":
                return this.width * rate;
            case "vertical":
                return this.height * rate;
        }
    }
    zoomIn(zoomCenter: Vector2D, factor: number): number {
        return this.zoomToFactor(1 - factor, zoomCenter);
    }
    zoomOut(zoomCenter: Vector2D, factor: number): number {
        return this.zoomToFactor(1 + factor, zoomCenter);
    }
    /**
     * 
     * @param factor if this is 0 or less, nothing happens
     * @param zoomCenter 
     * @returns the new zoom level (in meter/pixel).
     */
    zoomToFactor(factor: number, zoomCenter?: Vector2D): number {
        if (!zoomCenter) zoomCenter = new Vector2D(this.width / 2, this.height / 2);
        const newZoom = this._canvas.zoomToFactor(factor, zoomCenter);
        return newZoom;    
    }
}
