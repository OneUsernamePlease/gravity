import { Vector2D } from "@/util/vector2d.js";
import { Quadtree, QuadtreeNode } from "./quad-tree.js";
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
export function rebuildQuadtree(quadtree: Quadtree<ObjectState>, objectStates: Map<number, ObjectState>) {
    quadtree.empty();
    objectStates.forEach((objectState) => {
        quadtree.add(objectState);
    });
}
export function aggregateQuadtree(quadtree: Quadtree<ObjectState>): Map<QuadtreeNode<ObjectState>, MassAggregate> {
    const root = quadtree.root;
    const aggregate: Map<QuadtreeNode<ObjectState>, MassAggregate> = new Map();
    const aggregator: MassAggregator<ObjectState> = new MassAggregator<ObjectState> (
        (objectState: ObjectState) => {
            return objectState.body.mass;
        },
        (objectState: ObjectState) => {
            return objectState.position;
        }
    );
    
    // builds the aggregate-map by recursively aggregating from the passed node downwards
    const aggregateNode = (node: QuadtreeNode<ObjectState>): MassAggregate => {
        let tempAggregate = aggregate.get(node) || aggregator.empty();
        if (node.isLeafNode()) {
            node.data.forEach((objectState) => {
                tempAggregate = aggregator.add(tempAggregate, objectState);
            });
        } else {
            const children = node.getChildNodes();
            tempAggregate = aggregator.combine(aggregateNode(children?.NW!), tempAggregate);
            tempAggregate = aggregator.combine(aggregateNode(children?.NE!), tempAggregate);
            tempAggregate = aggregator.combine(aggregateNode(children?.SW!), tempAggregate);
            tempAggregate = aggregator.combine(aggregateNode(children?.SE!), tempAggregate);
        }
        aggregate.set(node, tempAggregate);
        return tempAggregate;
    }

    aggregateNode(root);

    return aggregate;
}
export function applyGravity(
    quadtree: Quadtree<ObjectState>,
    simulationState: Map<number, ObjectState>,
    gravityParameters: {
        g: number,
        gravityLowerBounds: number,
        gravityRadiusExponent: number,
        gravityReferenceDistance: number,
        deltaTInMs: number, // in ms
        thetaThreshold: number, // theta = (node side length) / (distance *body* to *center of mass of a node*); below threshold use node's mass aggregate
    }
) {
    
    rebuildQuadtree(quadtree, simulationState);
    const treeAggregation = aggregateQuadtree(quadtree);

    const calculateForce = (node: QuadtreeNode<ObjectState>, targetObjectState: ObjectState): Vector2D => {
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
                
                force = force.add(calculateForce(children.NW, targetObjectState));
                force = force.add(calculateForce(children.NE, targetObjectState));
                force = force.add(calculateForce(children.SW, targetObjectState));
                force = force.add(calculateForce(children.SE, targetObjectState));

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
        if (objectState.body.movable) {
            objectState.velocity = objectState.velocity.add(objectState.acceleration.scale(gravityParameters.deltaTInMs / 1000));
        } else {
            // REFACTOR ME: this does not need to happen every tick
            objectState.velocity = new Vector2D(0, 0);
        }
    }
    const updatePositions = (objectStates: Map<number, ObjectState>) => {
        objectStates.forEach((objectState) => {
            if (objectState.body.movable) {
                objectState.position = objectState.position.add(objectState.velocity.scale(gravityParameters.deltaTInMs / 1000));
            }
        })
    }

    simulationState.forEach((objectState) => {
        const appliedForce = calculateForce(quadtree.root, objectState);
        setAccelerationAndVelocity(objectState, appliedForce);
    });
    
    updatePositions(simulationState);
}
