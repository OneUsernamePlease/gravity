import { Rectangle } from "@/types/types.js";
import { Vector2D } from "./vector2d.js";


/**
 * Describes a rectangular Box.
 */
export class BoundingBox {
    private _box: Rectangle | null = {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
    };
    public padding = 0;
    constructor(
        options?: Partial<{ box: Rectangle | null, padding: number }>
    ) {
        if (options?.padding !== undefined) {
            this.padding = options.padding;
        }

        if (options?.box !== undefined) {
            this._box = options.box;
        } else {
            this.reset();
        }

    }
    
    get box(): Rectangle | null {
        return this._box;
    }
    private set box(rectangle: Rectangle) {
        this._box = rectangle;
    }

    reset() {
        this._box = null;
    }
    /**
     * Update only increases the size.
     */
    update(positionable: { position: Vector2D }) {
        const position = positionable.position;
        const newLeftBorder = position.x - this.padding;
        const newRightBorder = position.x + this.padding;
        const newTopBorder = position.y - this.padding;
        const newBottomBorder = position.y + this.padding;
        
        if (this.box !== null) {
            if (newLeftBorder < this.box.minX) {
                this.box.minX = newLeftBorder;
            } else if (newRightBorder > this.box.maxX) {
                this.box.maxX = newRightBorder;
            }
    
            if (newTopBorder < this.box.minY) {
                this.box.minY = newTopBorder;
            } else if (newBottomBorder > this.box.maxY) {
                this.box.maxY = newBottomBorder;
            }
        } else {
            this.box = {
                minX: newLeftBorder,
                minY: newTopBorder,
                maxX: newRightBorder,
                maxY: newBottomBorder,
            };
        }
    }

    build(positions: Map<number, Vector2D>) {
        this.reset();
        
        positions.forEach((position) => {
            this.update({ position });
        });
    }

}