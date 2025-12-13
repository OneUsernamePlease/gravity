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
    private get currentZoom() {
        return this.canvasSpace.currentZoom;
    }

    public scroll(displacement: { x: number; y: number }) {
        this.moveOrigin(displacement);
    }

    public zoomToFactor(factor: number, zoomCenter: Vector2D): number {
        if (factor <= 0) return this.currentZoom;
        
        const oldZoom = this.currentZoom;
        const newZoom = oldZoom * factor;
        const zoomDelta = newZoom - oldZoom;

        return this.zoomByStep(zoomCenter, zoomDelta)
    }

    /**
     * Zoom is measured in simulationUnits (meter) per canvasUnit (pixel)
     * @param zoomCenter this point stays fixed while zooming
     * @param zoomStep the change in meter per pixel. positive = zoom in, negative = zoom out
     * @returns the new zoom level
     */
    public zoomByStep(zoomCenter: Vector2D, zoomStep: number): number {
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