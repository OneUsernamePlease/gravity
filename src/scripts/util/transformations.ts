import { Vector2D } from "./vector2d.js";
export function relativePosition(absolutePosition: Vector2D, element: HTMLElement): Vector2D {
    const elementRect = element.getBoundingClientRect();
    const x = absolutePosition.x - elementRect.left;
    const y = absolutePosition.y - elementRect.top;
    return new Vector2D(x, y);
}
/**
 * @param direction *Vector2d* representing a coordinate.
 * @param context CanvasRenderingContext2D
 * @returns the transformed Vector2D
 */
export function pointFromCanvasToSimulation(point: Vector2D, context: CanvasRenderingContext2D): Vector2D {
    const contextTransformation = context.getTransform();
    const inverse = contextTransformation.inverse();
    const pointInSimulation = inverse.transformPoint(new DOMPoint(point.x, point.y));

    return new Vector2D(pointInSimulation);
}
