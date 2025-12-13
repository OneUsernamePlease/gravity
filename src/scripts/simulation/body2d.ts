import { twoDigitHex } from "../util/util";

export class Body2d {
//#region properties
    private _radius!: number;
    private _color!: string;
    private _movable!: boolean;
    static defaultDensity = 1;
//#endregion
// #region get, set
    public get mass() {
        return this._mass;
    }
    public set mass(newMass: number) {
        this._mass = Math.max(newMass, 1);
    }
    public get radius() {
        return this._radius;
    }
    private set radius(newRadius: number) {
        this._radius = Math.max(newRadius, 1);
    }
    public get movable() {
        return this._movable;
    }
    public set movable(movable: boolean) {
        this._movable = movable
    }   
    public get color() : string {
        return this._color
    }
    private set color(c: string) {
        if (!(CSS.supports("color", c))) {
            c = "#818181ff";
        }
        this._color = c;
    } 
// #endregion
    constructor(private _mass: number, movable?: boolean, color?: string, radius?: number)  {
        if (radius === undefined) { radius = this.defaultRadius(_mass); }
        this.radius = radius;
        if (color === undefined) { color = this.massDependentColor(_mass); }
        this.color = color;
        if (movable === undefined) { movable = true; }
        this.movable = movable;     
    }

    /**
     * returns the radius of a sphere based on mass and density
     */
    public defaultRadius(mass?: number) {
        if (!mass) {
            mass = this.mass;
        }
        return ((3 * mass)/(4 * Math.PI * Body2d.defaultDensity)) ** (1/3); 
    }
    /**
     * Sets the bodies' properties' values. If radius or color are omitted, their mass-dependent defaults are used.
     * @param mass number
     * @param radius number
     * @param mass
     */
    public setProperties(mass: number): void
    setProperties(mass: number, radius: number): void
    setProperties(mass: number, color: string): void
    setProperties(mass: number, radius: number, color: string): void
    setProperties(mass: number, maybeRadiusOrColor?: number | string, maybeColor?: string): void {
        if (!!maybeColor) {
            this.color = maybeColor;
            this.radius = +maybeRadiusOrColor!;
        } else {
            if (!maybeRadiusOrColor) {
                this.color = this.massDependentColor(mass);
                this.radius = this.defaultRadius(mass);
            } else if (typeof maybeRadiusOrColor === "string") {
                this.color = maybeRadiusOrColor;
                this.radius = this.defaultRadius(mass);
            } else if (typeof maybeRadiusOrColor === "number") {
                this.color = this.massDependentColor(mass);
                this.radius = maybeRadiusOrColor;
            }
        }
        
        this._mass = mass;
    }
    public massDependentColor(mass: number): string {
        const lowestColorMass = 50;
        const biggestColorMass = 100000000;
        const alpha = "ff";

        if (mass <= lowestColorMass) {
            return "#ff0000ff";
        }
        if (mass >= biggestColorMass) {
            return "#0000ffff";
        }
        const mid = Math.sqrt(lowestColorMass * biggestColorMass)
        let r,g,b;

        if (mass < mid) {
            // Red -> White
            const t = (Math.log(mass) - Math.log(lowestColorMass)) / (Math.log(mid) - Math.log(lowestColorMass));
            r = 255;
            g = Math.round(255 * t);
            b = Math.round(255 * t);
        } else {
            // White -> Blue
            const t = (Math.log(mass) - Math.log(mid)) / (Math.log(biggestColorMass) - Math.log(mid));
            r = Math.round(255 * (1 - t));
            g = Math.round(255 * (1 - t));
            b = 255;
        }

        return `#${twoDigitHex(r)}${twoDigitHex(g)}${twoDigitHex(b)}${alpha}`;
    }
}