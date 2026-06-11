import { DEFAULT_SCROLL_RATE } from "../const/const.js";
import { Canvas } from "./canvas.js";
import { AnimationSettings, UIAnimationSettings } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import { App } from "../app/app.js";

export class AnimationController {
//#region properties
    private _animationSettings: AnimationSettings;
    private _running: boolean;
//#endregion
//#region get, set
    private get canvas(): Canvas {
        return this._canvas;
    }
    private set canvas(canvas: Canvas) {
        this._canvas = canvas;
    }

    get animationSettings(): AnimationSettings {
        return this._animationSettings;
    }
    set animationSettings(animationSettings: AnimationSettings) {
        this._animationSettings = animationSettings;
    }

    private get app() {
        return this._app;
    }

    get running() {
        return this._running;
    }
    private set running(running: boolean) {
        this._running = running;
    }

    // additional getters
    get currentZoom(): number {
        return this.canvas.currentZoom;
    }
    get width(): number {
        return this.canvas.width;
    }
    get height(): number {
        return this.canvas.height;
    }
//#endregion
    constructor(
        private _canvas: Canvas, 
        private _app: App,
    ) {
        this._animationSettings = { frameLength: 25, displayVectors: true, tracePaths: true };
        this._running = false;
    }
    initialize(width: number, height: number, animationSettings: UIAnimationSettings) {
        this.resizeCanvas(width, height);
        this.canvas.fillBackground();
        this.animationSettings.displayVectors = animationSettings.displayVectors;
        this.animationSettings.tracePaths = animationSettings.tracePaths;
    }
    run() {
        if (this.running) {
            return;
        }
        this.running = true;
        const loop = () => {
            if (this.running) {
                setTimeout(loop, this.animationSettings.frameLength);
                this.canvas.drawFrame(this.app.currentSimulationState, this.animationSettings);
                this.app.updateStatusBarSimulationInfo();
            }
        };
        loop();
    }
    stop() {
        this.running = false;
    }
    setDisplayVectors(display: boolean) {
        this.animationSettings.displayVectors = display;
    }
    setTracePaths(tracePaths: boolean) {
        this.animationSettings.tracePaths = tracePaths;
    }
    resetPaths() {
        this.canvas.resetPaths();
    }
    resizeCanvas(width: number, height: number) {
        this.canvas.resize(width, height);
    }

    scrollRight(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal");
        }
        this.canvas.move(new Vector2D(-distance, 0));
    }
    scrollLeft(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("horizontal");
        }
        this.canvas.move(new Vector2D(distance, 0));
    }
    scrollUp(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical");
        }
        this.canvas.move(new Vector2D(0, distance));
    }
    scrollDown(distance?: number) {
        if (!distance) {
            distance = this.scrollDistance("vertical");
        }
        this.canvas.move(new Vector2D(0, -distance));
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
