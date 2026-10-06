import { Vector2D } from "@/util/vector2d.js";
import { QuadTree, QuadTreeNode } from "./quad-tree.js";
import { ObjectState } from "@/types/types.js";

export type GetMass<T> = (element: T) => number;
export type GetPosition<T> = (element: T) => Vector2D;
export interface Aggregator<T, M> {
    generate(element: T): M;
    combine(a: M, b: M): M;
    add(aggregate: M, element: T): M;
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
    ) { }
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
export function aggregateQuadtree(quadtree: QuadTree<ObjectState>): Map<QuadTreeNode<ObjectState>, MassAggregate> {
    const root = quadtree.root;
    const aggregate: Map<QuadTreeNode<ObjectState>, MassAggregate> = new Map();
    const aggregator: MassAggregator<ObjectState> = new MassAggregator<ObjectState> (
        (objectState: ObjectState) => {
            return objectState.body.mass;
        },
        (objectState: ObjectState) => {
            return objectState.position;
        }
    );
    
    const aggregateNode = (node: QuadTreeNode<ObjectState>): MassAggregate => {
        let tempAggregate = aggregate.get(node) || aggregator.empty();
        if (node.isLeafNode()) {
            for (let i = 0; i < node.data.length; i++) {
                if (i === 0) {
                    tempAggregate = aggregator.generate(node.data[i]);
                } else {
                    tempAggregate = aggregator.add(tempAggregate, node.data[i])
                }                
            }
        } else {
            const children = node.getChildNodes();
            children?.forEach((child) => {
                const childNodeAggregate = aggregate.get(child) || aggregateNode(child);
                
                tempAggregate = aggregator.combine(childNodeAggregate, tempAggregate)
            })
        }
        aggregate.set(node, tempAggregate);
        return tempAggregate;
    }

    aggregateNode(root);
    return aggregate;
}


