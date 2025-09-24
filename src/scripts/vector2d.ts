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
     * @returns this - v
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
     * @returns Distance to v
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
     * @returns an array of two normalized vectors, both normal to this, both pointing in opposite directions
     */
    public normalVectors(): Vector2D[] {
        const array: Vector2D[] = [];
        const v = this.normalize();
        array.push(new Vector2D(-v.y, v.x));
        array.push(new Vector2D(v.y, -v.x));
        return array;
    }
    /**
     * Reflects this vector on reflectionSurface.
     * @param reflectionSurface acts as a mirror
     * @returns The reflected vector
     */
    public reflect(reflectionSurface: Vector2D): Vector2D {
        reflectionSurface = reflectionSurface.normalize();
        const axis = reflectionSurface.normalVectors()[0];
        const dotAxis = this.dotProduct(axis);
        const projection = axis.scale(dotAxis).scale(2);
        const reflected = this.subtract(projection);
        return reflected;
    }
    /**
     * @param line1 defined by two points
     * @param line2 defined by two points
     * @param strict false by default. If true, the intersection must be within the points' distances, not just the infinite lines.
     * @returns the intersection point of the two lines, null if they don't intersect, or the line (defined by the two points) if they are identical
     */
    private static linesIntersecting(line1: [p1: Vector2D, p2: Vector2D], line2: [q1: Vector2D, q2: Vector2D], strict = false): Vector2D | null | [Vector2D, Vector2D] {
        const [p1, p2] = line1;
        const [q1, q2] = line2;

        const r = p2.subtract(p1);
        const s = q2.subtract(q1);
        const rCrossS = r.x * s.y - r.y * s.x;

        const qMinusP = q1.subtract(p1);
        const qmpCrossR = qMinusP.x * r.y - qMinusP.y * r.x;

        if (rCrossS === 0) {
            if (qmpCrossR === 0) {
                // lines are collinear
                if (strict) {
                    // overlap
                    const t0 = q1.subtract(p1).dotProduct(r) / r.dotProduct(r);
                    const t1 = q2.subtract(p1).dotProduct(r) / r.dotProduct(r);

                    const tMin = Math.max(0, Math.min(t0, t1));
                    const tMax = Math.min(1, Math.max(t0, t1));

                    if (tMin <= tMax) {
                        const pointA = p1.add(r.scale(tMin));
                        const pointB = p1.add(r.scale(tMax));
                        return [pointA, pointB];
                    } else {
                        return null;
                    }
                }

                // lines are identical
                return [p1, p2];
            }
            // parallel
            return null;
        }

        // not parallel
        const t = (qMinusP.x * s.y - qMinusP.y * s.x) / rCrossS;
        const u = (qMinusP.x * r.y - qMinusP.y * r.x) / rCrossS;

        if (strict) {
            if (t < 0 || t > 1 || u < 0 || u > 1) {
                return null;
            }
        }

        const intersection = p1.add(r.scale(t));
        return intersection;
    }

}