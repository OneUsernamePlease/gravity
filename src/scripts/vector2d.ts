export class Vector2D {
    public x: number;
    public y: number;
    constructor(x?: number, y?: number) {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        this.x = x;
        this.y = y;
    }
    public toString() {
        return `x: ${this.x}, y: ${this.y}`;
    }
    public add(...vectors: Vector2D[]): Vector2D {
        const result: Vector2D = vectors.reduce((previous, current) => {
            return new Vector2D(previous.x + current.x, previous.y + current.y);
        }, new Vector2D(this.x, this.y));
        return result;
    }
    /**
     * @returns v1 - v2
     */
    public subtract(v: Vector2D): Vector2D {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }
    public scale(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    public dotProduct(v: Vector2D): number {
        return this.x * v.x + this.y * v.y;
    }
    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    public normalize(): Vector2D {
        const magnitude = this.magnitude();
        if (magnitude === 0) {
            return new Vector2D(0, 0);
        } else {
            return this.scale(1 / magnitude);
        }
    }
    /**
     * @param v Vector2D
     * @returns Distance to v2
     */
    public distance(v: Vector2D): number {
        return Math.sqrt((v.x - this.x)**2 + (v.y - this.y)**2);
    }
    /**
     * returns a vector pointing to v
     */
    public displacementVector(v: Vector2D) {
        return v.subtract(this);
    }
    public hadamardProduct(v: Vector2D) {
        return new Vector2D(this.x * v.x, this.y * v.y);
    }
    /**
     * @returns an array of two normalized vectors, both normal to v, both pointing in opposite directions
     */
    public normalVectors(v: Vector2D): Vector2D[] {
        const array: Vector2D[] = [];
        v = v.normalize();
        array.push(new Vector2D(-v.y, v.x));
        array.push(new Vector2D(v.y, -v.x));
        return array;
    }
}