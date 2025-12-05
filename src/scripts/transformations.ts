import { CanvasSpace } from "./types";
import { Coordinate, Vector2D } from "./vector2d";

export function absoluteToCanvasPosition(absolutePosition: Coordinate, canvas: HTMLCanvasElement): Vector2D {
    const canvasRect = canvas.getBoundingClientRect();
    const x = absolutePosition.x - canvasRect.left;
    const y = absolutePosition.y - canvasRect.top;
    return new Vector2D(x, y);
}
export function relativePosition(absolutePosition: Coordinate, element: HTMLElement): Vector2D {
    const canvasRect = element.getBoundingClientRect();
    const x = absolutePosition.x - canvasRect.left;
    const y = absolutePosition.y - canvasRect.top;
    return new Vector2D(x, y);
}
export function pointFromCanvasSpaceToSimulationSpace(point: Vector2D, canvasSpace: CanvasSpace): Vector2D {
    // transformation:
    // 1. scale (canvasVector * zoom in simulationUnits/canvasUnit)
    // 2. flip (y axis are in opposite directions)
    // 3. shift (scaledAndFlippedPoint + Origin of C in SimSpace)
    const scaled = point.scale(canvasSpace.currentZoom);
    const flipped = scaled.hadamardProduct(new Vector2D(1, canvasSpace.orientationY));
    const shifted = flipped.add(canvasSpace.origin);
    return shifted;
}

export function pointFromSimulationSpaceToCanvasSpace(point: Vector2D, canvasSpace: CanvasSpace): Vector2D {
    // transformation:
    // 1. shift (point in SimSpace - Origin of C in SimSpace)
    // 2. flip (y axis point in opposite directions)
    // 3. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const shifted: Vector2D = point.subtract(canvasSpace.origin);
    const flipped: Vector2D = new Vector2D(shifted.x, shifted.y * -1);
    const scaled: Vector2D = flipped.scale(1 / canvasSpace.currentZoom);
    return scaled;
}
export function directionFromSimulationSpaceToCanvasSpace(direction: Vector2D, canvasSpace: CanvasSpace): Vector2D {
    // transformation:
    // 1. flip (y axis are in opposite directions)
    // 2. scale (result from 2 divided by Zoom in simulationUnits/canvasUnit)
    const flipped: Vector2D = new Vector2D(direction.x, direction.y * -1);
    const scaled: Vector2D = flipped.scale(1 / canvasSpace.currentZoom);
    return scaled;
}
