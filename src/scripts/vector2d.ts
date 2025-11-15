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
    public add(...vectors: {x: number, y: number}[]): Vector2D {
        const result = vectors.reduce((previous, current) => {
            return { x: (previous.x + current.x), y: (previous.y + current.y) };
        }, {x: this.x, y: this.y});
        return new Vector2D(result.x, result.y);
    }
    /**
     * @returns this - v
     */
    public subtract(v: {x: number, y: number}): Vector2D {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }
    public scale(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    public dotProduct(v: {x: number, y: number}): number {
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
    public distance(v: {x: number, y: number}): number {
        return Math.sqrt((v.x - this.x)**2 + (v.y - this.y)**2);
    }
    /**
     * returns a vector pointing from this to v
     */
    public displacementVector(v: {x: number, y: number}) {
        const vector = new Vector2D(v.x, v.y);
        return vector.subtract(this);
    }
    public hadamardProduct(v: {x: number, y: number}) {
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
     * @param strict false by default. If true, the intersection must be within the line segments defined by the coordinates, not just the infinite lines.
     * @returns The intersection of the two lines: a point, null if they don't intersect, or a line (defined by two points) if they are identical, or collinear and overlapping.
     * https://stackoverflow.com/a/565282/97076991 - authored by ai.
     */
    public static linesIntersecting(line1: [p1: Vector2D, p2: Vector2D], line2: [q1: Vector2D, q2: Vector2D], strict = false): Vector2D | null | [Vector2D, Vector2D] {
        const [p1, p2] = line1;
        const [q1, q2] = line2;
        
        const r = p2.subtract(p1);
        const s = q2.subtract(q1);
        const rCrossS = r.x * s.y - r.y * s.x;

        const qMinusP = q1.subtract(p1);
        const qmpCrossR = qMinusP.x * r.y - qMinusP.y * r.x;

        if (rCrossS === 0) {
            if (qmpCrossR === 0) {
                // collinear
                if (strict) {
                    const t0 = q1.subtract(p1).dotProduct(r) / r.dotProduct(r);
                    const t1 = q2.subtract(p1).dotProduct(r) / r.dotProduct(r);

                    const tMin = Math.max(0, Math.min(t0, t1));
                    const tMax = Math.min(1, Math.max(t0, t1));

                    if (tMin <= tMax) {
                        const pointA = p1.add(r.scale(tMin));
                        const pointB = p1.add(r.scale(tMax));
                        if (tMin === tMax) {
                            // overlap at a point
                            return pointA;
                        } else {
                            // overlap at a line
                            return [pointA, pointB];
                        }
                    } else {
                        // no overlap
                        return null;
                    }
                }

                // identical
                return [p1, p2];
            }
            // parallel
            return null;
        }

        // point intersection
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
    public static simpleLineIntersection(line1: [p1: Vector2D, p2: Vector2D], line2: [q1: Vector2D, q2: Vector2D]): Vector2D | null {
        // make sure lines are strictly defined (p1 != p2, same for line2)
        
        // check for general intersection

        // if parallel or identical, -> null
        // otherwise intersection: {x, y}

        // order points so that p1.x <= p2.x and q1.x <= q2.x

        // p1.x <= intersection.x <= p2.x
        // q1.x <= intersection.x <= q2.x
        // and same for y
        throw new Error("Method not implemented.");
    }
    /**
     * Written by ChatGPT-4
     * @param line1 
     * @param line2 
     * @param strict 
     * @param epsilon 
     * @returns 
     */
    public static linesIntersectingButBetter(
        line1: [p1: Vector2D, p2: Vector2D],
        line2: [q1: Vector2D, q2: Vector2D],
        strict = false,
        epsilon = 1e-9 // Default epsilon value
    ): Vector2D | null | [Vector2D, Vector2D] {
        const [p1, p2] = line1;
        const [q1, q2] = line2;
        
        const r = p2.subtract(p1);
        const s = q2.subtract(q1);
        const rCrossS = r.x * s.y - r.y * s.x;

        const qMinusP = q1.subtract(p1);
        const qmpCrossR = qMinusP.x * r.y - qMinusP.y * r.x;

        // Using epsilon for floating-point precision comparison
        const isZero = (value: number) => Math.abs(value) < epsilon;

        if (isZero(rCrossS)) {
            if (isZero(qmpCrossR)) {
                // collinear
                if (strict) {
                    const t0 = q1.subtract(p1).dotProduct(r) / r.dotProduct(r);
                    const t1 = q2.subtract(p1).dotProduct(r) / r.dotProduct(r);

                    const tMin = Math.max(0, Math.min(t0, t1));
                    const tMax = Math.min(1, Math.max(t0, t1));

                    if (tMin <= tMax) {
                        const pointA = p1.add(r.scale(tMin));
                        const pointB = p1.add(r.scale(tMax));
                        if (isZero(tMin - tMax)) {
                            // overlap at a point
                            return pointA;
                        } else {
                            // overlap at a line
                            return [pointA, pointB];
                        }
                    } else {
                        // no overlap
                        return null;
                    }
                }

                // identical
                return [p1, p2];
            }
            // parallel
            return null;
        }

        // point intersection
        const t = (qMinusP.x * s.y - qMinusP.y * s.x) / rCrossS;
        const u = (qMinusP.x * r.y - qMinusP.y * r.x) / rCrossS;

        if (strict) {
            if (t < -epsilon || t > 1 + epsilon || u < -epsilon || u > 1 + epsilon) {
                return null;
            }
        }

        const intersection = p1.add(r.scale(t));
        return intersection;
    }

}