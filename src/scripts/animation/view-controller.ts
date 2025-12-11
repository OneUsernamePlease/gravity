import { MAX_ZOOM, MIN_ZOOM } from "../const/const";
import { Vector2D } from "../util/vector2d";
import { AnimationController } from "./animation-controller";

/**
 * This class is responsible for the view into the simulation, which is defined by the CanvasSpace-Interface.
 * That includes: scrolling/panning, and zoom.
 */

export class ViewController {
    constructor(
        private animation: AnimationController,
    ) {}

    private get canvasSpace() {
        return this.animation.canvasSpace;
    }

    public scroll(displacement: { x: number; y: number }) {
        this.moveOrigin(displacement);
    }

    public zoomToFactor(factor: number, zoomCenter: Vector2D): number {
        return this.animation.zoomToFactor(factor, zoomCenter);
    }

    /**
     * Zoom is measured in simulationUnits (meter) per canvasUnit (pixel)
     * @param zoomCenter this point stays fixed while zooming
     * @param zoomStep the change of meter per pixel
     * @returns the new zoom level
     */
    public zoomOut(zoomCenter: Vector2D, zoomStep: number): number {
        if (this.canvasSpace.currentZoom >= MAX_ZOOM) { 
            return this.canvasSpace.currentZoom; 
        }

        let newZoom = this.canvasSpace.currentZoom + zoomStep;
        if(newZoom > MAX_ZOOM) {
            newZoom = MAX_ZOOM;
            zoomStep = MAX_ZOOM - this.canvasSpace.currentZoom;
        }
        
        const shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        this.moveOrigin(shiftOrigin.hadamardProduct({x: -1, y: 1}));
        this.canvasSpace.currentZoom = newZoom;

        return newZoom;
    }
    /**
     * Zoom is measured in simulationUnits (meter) per canvasUnit (pixel)
     * @param zoomCenter this point stays fixed while zooming
     * @param zoomStep the change in meter per pixel
     * @returns the new zoom level
     */
    public zoomIn(zoomCenter: Vector2D, zoomStep: number): number {
        if (this.canvasSpace.currentZoom <= MIN_ZOOM) { 
            return this.canvasSpace.currentZoom; 
        }

        let newZoom = this.canvasSpace.currentZoom - zoomStep;
        if (newZoom < MIN_ZOOM) {
            newZoom = MIN_ZOOM;
            zoomStep = this.canvasSpace.currentZoom - MIN_ZOOM;
        }
        
        const shiftOrigin: Vector2D = zoomCenter.scale(zoomStep);
        this.moveOrigin(shiftOrigin.hadamardProduct({x: 1, y: -1}));
        this.canvasSpace.currentZoom = newZoom;

        return newZoom;
    }
    private moveOrigin(displacement: { x: number, y: number}) {
        const originPosition = this.canvasSpace.origin;
        const newOrigin = originPosition.add(displacement);
        this.setOrigin(newOrigin);
    }
    /**
     * Origin {x:0,y:0} is at the top-left
     */
    private setOrigin(newOrigin: Vector2D) {
        this.canvasSpace.origin = newOrigin;
    }

}