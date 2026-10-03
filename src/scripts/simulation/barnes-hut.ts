import { Vector2D } from "@/util/vector2d.js";
export type GetMass<T> = (element: T) => number;
export type GetPosition<T> = (element: T) => Vector2D;
export type Aggregator<T, M> = {
    generate(element: T): M;
    combine(a: M, b: M): M;
    empty(): M;
}
export type MassAggregate = {
    totalMass: number;
    centerOfMass: Vector2D;
}
export class MassAggregator<T> implements Aggregator<T, MassAggregate> {
    constructor(
        private getMass: GetMass<T>,
        private getPosition: GetPosition<T>,
    ) {}
    generate(element: T): MassAggregate {
        return {
            totalMass: this.getMass(element),
            centerOfMass: this.getPosition(element)
        }
    }
    combine(a: MassAggregate, b: MassAggregate): MassAggregate {
        const totalMass = a.totalMass + b.totalMass;
        let centerOfMass = new Vector2D();
        
        if (totalMass !== 0) {
            centerOfMass = a.centerOfMass.scale(a.totalMass)
            .add(b.centerOfMass.scale(b.totalMass))
            .scale(1 / totalMass);
        }

        return {
            totalMass,
            centerOfMass 
        }
    }
    add(aggregate: MassAggregate, element: T): MassAggregate {
        const mass = this.getMass(element);
        const totalMass = aggregate.totalMass + mass;
        let centerOfMass = new Vector2D();
        
        if (totalMass !== 0) {
            centerOfMass = aggregate.centerOfMass.scale(aggregate.totalMass)
            .add(this.getPosition(element).scale(mass))
            .scale(1 / totalMass);
        }

        return {
            totalMass,
            centerOfMass
        }
    }
    empty(): MassAggregate {
        return {
            totalMass: 0,
            centerOfMass: new Vector2D(0, 0)
        }
    }
}