import { Vector2D } from "@/util/vector2d.js";
import { QuadTree, QuadTreeNode } from "./quad-tree.js";
import { ObjectState } from "@/types/types.js";
import { Physics } from "./physics.js";

export type GetMass<T> = (element: T) => number;
export type GetPosition<T> = (element: T) => Vector2D;
export type MassAggregate = {
    totalMass: number;
    centerOfMass: Vector2D;
}
export interface Aggregator<T, M> {
    generate(element: T): M;
    combine(a: M, b: M): M;
    add(aggregate: M, element: T): M;
    empty(): M;
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
export function rebuildQuadtree(objectStates: ObjectState[], quadtree: QuadTree<ObjectState>) {
    quadtree.empty();
    objectStates.forEach((objectState) => {
        quadtree.add(objectState);
    });
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
    
    // builds the aggregate-map by recursively aggregating from the passed node downwards
    const aggregateNode = (node: QuadTreeNode<ObjectState>): MassAggregate => {
        let tempAggregate = aggregate.get(node) || aggregator.empty();
        if (node.isLeafNode()) {
            node.data.forEach((objectState) => {
                tempAggregate = aggregator.add(tempAggregate, objectState);
            });
        } else {
            const children = node.getChildNodes();
            children?.forEach((child) => {
                const childNodeAggregate = aggregateNode(child);
                tempAggregate = aggregator.combine(childNodeAggregate, tempAggregate);
            });
        }
        aggregate.set(node, tempAggregate);
        return tempAggregate;
    }

    aggregateNode(root);

    return aggregate;
}
export function applyGravity(
    quadtree: QuadTree<ObjectState>,
    objectStates: ObjectState[],
    gravityParameters: {
        g: number,
        gravityLowerBounds: number,
        gravityRadiusExponent: number,
        gravityReferenceDistance: number,
        deltaTInMs: number, // in ms
        thetaThreshold: number, // theta = (node side length) / (distance *body* to *center of mass of a node*); below threshold use node's mass aggregate
    }
) {
    const treeAggregation = aggregateQuadtree(quadtree);

    const calculateForce = (node: QuadTreeNode<ObjectState>, targetObjectState: ObjectState): Vector2D => {
        const nodeAggregation = treeAggregation.get(node);
        if (nodeAggregation === undefined) {
            throw new Error(`node-aggregate is missing for ${node.toString()}`);
        }
        const nodeMass = nodeAggregation.totalMass;
        if (nodeMass === 0) {
            return new Vector2D();
        }

        if (node.isLeafNode()) {
            let force = new Vector2D();
            node.data.forEach((objectState) => {
                if (objectState === targetObjectState) {
                    return;
                }
                force = force.add(Physics.gravitationalForceBetweenBodies(
                    targetObjectState,
                    objectState,
                    gravityParameters.g,
                    gravityParameters.gravityLowerBounds,
                    gravityParameters.gravityRadiusExponent,
                    gravityParameters.gravityReferenceDistance
                ));
            })
            return force;
        } else {
            const nodeCenterOfMass = nodeAggregation.centerOfMass;
            const theta = node.sideLength / targetObjectState.position.distance(nodeCenterOfMass);
            
            if (node.hasWithinBounds(targetObjectState.position) ||
                theta >= gravityParameters.thetaThreshold
            ) {
                let force = new Vector2D();
                const children = node.getChildNodes()!;

                children.forEach((child) => {
                    force = force.add(calculateForce(child, targetObjectState));
                });
                
                return force;
            } else {
                return Physics.gravitationalForceBetweenBodies(
                    targetObjectState,
                    { body: { mass: nodeMass }, position: nodeCenterOfMass },
                    gravityParameters.g,
                    gravityParameters.gravityLowerBounds,
                    gravityParameters.gravityRadiusExponent,
                    gravityParameters.gravityReferenceDistance
                );
            }
        }
    }
    const setAccelerationAndVelocity = (objectState: ObjectState, force: Vector2D) => {
        objectState.acceleration = force.scale(1 / objectState.body.mass);
        objectState.velocity = objectState.velocity.add(objectState.acceleration.scale(gravityParameters.deltaTInMs / 1000));
    }
    const updatePositions = (objectStates: ObjectState[]) => {
        objectStates.forEach((objectState) => {
            objectState.position = objectState.position.add(objectState.velocity.scale(gravityParameters.deltaTInMs / 1000));
        })
    }

    objectStates.forEach((objectState) => {
        const appliedForce = calculateForce(quadtree.root, objectState);
        setAccelerationAndVelocity(objectState, appliedForce);
    });
    
    updatePositions(objectStates);
}
