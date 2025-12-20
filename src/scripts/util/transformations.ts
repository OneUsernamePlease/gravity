import { CanvasSpace } from "../types/types";
import { Coordinate, Vector2D } from "./vector2d";
export function relativePosition(absolutePosition: Coordinate, element: HTMLElement): Vector2D {
    const elementRect = element.getBoundingClientRect();
    const x = absolutePosition.x - elementRect.left;
    const y = absolutePosition.y - elementRect.top;
    return new Vector2D(x, y);
}
/**
 * A cartesian transformation of a point on a canvas, which is defined by canvasSpace (zoom (scale), origin (translation), alignment of y-axis (compared to the target coordinate system, eg. -1 if they point in opposite directions), no rotation), to the coordinate system the canvasSpace is defined in.
 * @param direction *Vector2d* representing a coordinate.
 * @param canvasSpace 
 * @returns the transformed Vector2D
 */
export function pointFromCanvasToSimulation(point: Vector2D, canvasSpace: CanvasSpace): Vector2D {
    // transformation:
    // 1. scale (canvasVector * zoom in simulationUnits/canvasUnit)
    // 2. flip (y axis are in opposite directions)
    // 3. shift (scaledAndFlippedPoint + Origin of C in SimSpace)
    const scaled = point.scale(canvasSpace.currentZoom);
    const flipped = scaled.hadamardProduct(new Vector2D(1, canvasSpace.orientationY));
    const shifted = flipped.add(canvasSpace.origin);
    return shifted;
}

/**
 * Transforms a point from cartesian space to its position on a canvas, defined by canvasSpace.
 * @param direction *Vector2d* representing a coordinate.
 * @param canvasSpace 
 * @returns the transformed Vector2D
 */
export function pointFromSimulationToCanvas(point: Vector2D, canvasSpace: CanvasSpace): Vector2D {
    // transformation:
    // 1. shift (point in SimSpace - Origin of C in SimSpace)
    // 2. flip (y axis point in opposite directions)
    // 3. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const shifted: Vector2D = point.subtract(canvasSpace.origin);
    const flipped: Vector2D = new Vector2D(shifted.x, shifted.y * -1);
    const scaled: Vector2D = flipped.scale(1 / canvasSpace.currentZoom);
    return scaled;
}
/**
 * Transforms a direction/distance from cartesian space to its position on a canvas, defined by canvasSpace.
 * @param direction *Vector2d* representing a direction (a vector from the origin to this coordinate)
 * @param canvasSpace 
 * @returns the transformed Vector2D
 */
export function directionFromSimulationToCanvas(direction: Vector2D, canvasSpace: CanvasSpace): Vector2D {
    // transformation:
    // 1. flip (y axis are in opposite directions)
    // 2. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const flipped: Vector2D = new Vector2D(direction.x, direction.y * -1);
    const scaled: Vector2D = flipped.scale(1 / canvasSpace.currentZoom);
    return scaled;
}
