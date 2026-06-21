import { Vector2D } from "../util/vector2d.js";

/**
 * Draws a line from position to position + direction.
 * @param from on context
 * @param to on context
 */
export function drawLine(from: Vector2D, to: Vector2D, color = "white", lineWidth = 1, context: CanvasRenderingContext2D) {
    //if (!this.isLinePotentiallyVisible(position, endPosition)) {
    //    return;
    //}
    const transform = context.getTransform();
    const scaleX = Math.hypot(transform.a, transform.b); // scaleX === scaleY
    context.beginPath();
    context.lineWidth = lineWidth / scaleX; // lineWidth * this._canvasSpace.currentZoom;
    context.strokeStyle = color;
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
}
/**
 * @param line [0] -> line start. [1] -> line end.
 * @param color 
 * @param lineWidth independent of zoom
 * @param context CanvasRenderingContext2D
 */
export function drawLineBatch(line: [Vector2D, Vector2D][], color: string, lineWidth: number, context: CanvasRenderingContext2D) {
    const transform = context.getTransform();
    const scaleX = Math.hypot(transform.a, transform.b); // scaleX === scaleY

    context.beginPath();
    context.lineWidth = lineWidth / scaleX; // lineWidth * this._canvasSpace.currentZoom;
    context.strokeStyle = color;

    line.forEach((line) => {
        context.moveTo(line[0].x, line[0].y);
        context.lineTo(line[1].x, line[1].y);
    });
    
    context.stroke();
}
/**
 * draws a circular body at specified position, in specified color
 * @param position in simulation
 * @param radius in simulation
 * @param color default white
 */
export function drawCircle(position: Vector2D, radius: number, color: string = "white", context: CanvasRenderingContext2D) {
    //if (!this.isCircleVisible(position, radius)) return;
    context.beginPath();
    context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle = color;
    context.fill();
}
export function drawText(position: {x: number, y: number}, text: string, color: string, fontSize: string, context: CanvasRenderingContext2D) {
    context.fillStyle = color;
    context.font = `${fontSize}px sans-serif`;
    context.fillText(text, position.x, position.y)
}