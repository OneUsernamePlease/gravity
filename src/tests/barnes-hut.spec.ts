import { expect, test } from "vitest";
import { Quadtree } from "../scripts/simulation/quad-tree";
import { Vector2D } from "../scripts/util/vector2d";
import { aggregateQuadtree, applyGravity } from "../scripts/simulation/barnes-hut";

interface TestBody {
    body: {
        mass: number
    },
    position: Vector2D,
}
interface TestObjectState {
    body: {
        mass: number,
        movable: boolean,
    },
    position: Vector2D,
    velocity: Vector2D,
    acceleration: Vector2D,
}
interface TestObjectStateMapElement {
    id: number,
    state: TestObjectState
}
const getElementPosition = (element: TestBody) => {
    return element.position;
}
const buildTree = (
    quadtreeOptions: {
        position: Vector2D,
        sideLength: number,
        leafSize: number,
        maxDepth: number
    },
    ...bodies: TestBody[]
): Quadtree<TestBody> => {
    const quadtree = new Quadtree<TestBody>(
        getElementPosition,
        quadtreeOptions.position,
        quadtreeOptions.sideLength,
        quadtreeOptions.leafSize,
        quadtreeOptions.maxDepth,
    );

    bodies.forEach((body) => {
        quadtree.add(body);
    });

    return quadtree;
}
const gravityParameters = {
    g: 10,
    gravityLowerBounds: 1,
    gravityRadiusExponent: 2,
    gravityReferenceDistance: 400,
    deltaTInMs: 1000,
    thetaThreshold: 0.5,
}

test.describe("aggregate mass", () => {
    test("aggregate tree with two elements at root depth", () => {
        let testElementCounter = 0;
        const treeOptions = {
            position: new Vector2D(0, 0),
            sideLength: 100,
            leafSize: 2,
            maxDepth: 32,
        }

        const body1: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(0, 0),
        }
        const body2: TestBody = {
            body: {
                mass: 3
            },
            position: new Vector2D(4, 0),
        }

        const tree: Quadtree<TestBody> = buildTree(treeOptions, body1, body2);

        const massAggregate = aggregateQuadtree(tree);
        const rootAggregate = massAggregate.get(tree.root);
        expect(rootAggregate).toEqual({
            totalMass: 4,
            centerOfMass: { x: 3, y: 0 } 
        })
    });

    test("aggregate tree with four elements at depth 1, one per leaf", () => {
        let testElementCounter = 0;
        const treeOptions = {
            position: new Vector2D(0, 0),
            sideLength: 100,
            leafSize: 1,
            maxDepth: 32
        } 

        const body1: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(1, 1),
        }
        const body2: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(99, 1),
        }
        const body3: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(1, 99),
        }
        const body4: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(99, 99),
        }

        const tree = buildTree(treeOptions, body1, body2, body3, body4);

        const rootChildren = tree.root.getChildNodes()!;
        
        const massAggregate = aggregateQuadtree(tree);
        
        const rootAggregate = massAggregate.get(tree.root);
        const nwChildAggregate = massAggregate.get(rootChildren[0]);
        const neChildAggregate = massAggregate.get(rootChildren[1]);
        const swChildAggregate = massAggregate.get(rootChildren[2]);
        const seChildAggregate = massAggregate.get(rootChildren[3]);

        expect(rootAggregate).toEqual({
            totalMass: 4,
            centerOfMass: { x: 50, y: 50 } 
        })
        expect(nwChildAggregate).toEqual({
            totalMass: 1,
            centerOfMass: { x: 1, y: 1 } 
        })
        expect(neChildAggregate).toEqual({
            totalMass: 1,
            centerOfMass: { x: 99, y: 1 } 
        })
        expect(swChildAggregate).toEqual({
            totalMass: 1,
            centerOfMass: { x: 1, y: 99 } 
        })
        expect(seChildAggregate).toEqual({
            totalMass: 1,
            centerOfMass: { x: 99, y: 99 } 
        })
    });

    test("aggregate tree with elements at depth 1, more than one per leaf", () => {
        const treeOptions = {
            position: new Vector2D(0, 0),
            sideLength: 100,
            leafSize: 2,
            maxDepth: 32,
        }

        const body1: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(1, 1),
        }
        const body2: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(49, 49),
        }
        const body3: TestBody = {
            body: {
                mass: 2
            },
            position: new Vector2D(99, 99),
        }

        const tree = buildTree(treeOptions, body1, body2, body3);

        const rootChildren = tree.root.getChildNodes()!;
        
        const massAggregate = aggregateQuadtree(tree);
        
        const rootAggregate = massAggregate.get(tree.root);
        const nwChildAggregate = massAggregate.get(rootChildren[0]);
        const neChildAggregate = massAggregate.get(rootChildren[1]);
        const swChildAggregate = massAggregate.get(rootChildren[2]);
        const seChildAggregate = massAggregate.get(rootChildren[3]);

        expect(rootAggregate).toEqual({
            totalMass: 4,
            centerOfMass: { x: 62, y: 62 } 
        })
        expect(nwChildAggregate).toEqual({
            totalMass: 2,
            centerOfMass: { x: 25, y: 25 } 
        })
        expect(neChildAggregate).toEqual({
            totalMass: 0,
            centerOfMass: { x: 0, y: 0 } 
        })
        expect(swChildAggregate).toEqual({
            totalMass: 0,
            centerOfMass: { x: 0, y: 0 } 
        })
        expect(seChildAggregate).toEqual({
            totalMass: 2,
            centerOfMass: { x: 99, y: 99 } 
        })
    });
    
    test("aggregate depth-2-tree", () => {
        const treeOptions = {
            position: new Vector2D(0, 0),
            sideLength: 100,
            leafSize: 2,
            maxDepth: 32,
        }

        const body1: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(1, 1),
        }
        const body2: TestBody = {
            body: {
                mass: 2
            },
            position: new Vector2D(15, 15),
        }
        const body3: TestBody = {
            body: {
                mass: 1
            },
            position: new Vector2D(49, 49),
        }
        const body4: TestBody = {
            body: {
                mass: 2
            },
            position: new Vector2D(99, 99),
        }
        const body5: TestBody = {
            body: {
                mass: 2
            },
            position: new Vector2D(90, 95),
        }

        
        const tree = buildTree(treeOptions, body1, body2, body3, body4, body5);

        const massAggregate = aggregateQuadtree(tree);
        const rootAggregate = massAggregate.get(tree.root);

        const rootChildren = tree.root.getChildNodes()!;
        const nwChildAggregate = massAggregate.get(rootChildren[0]);
        const neChildAggregate = massAggregate.get(rootChildren[1]);
        const swChildAggregate = massAggregate.get(rootChildren[2]);
        const seChildAggregate = massAggregate.get(rootChildren[3]);
        
        const rootNwChildChildren = rootChildren[0].getChildNodes()!;
        const nwNwChildAggregate = massAggregate.get(rootNwChildChildren[0]);
        const nwNeChildAggregate = massAggregate.get(rootNwChildChildren[1]);
        const nwSwChildAggregate = massAggregate.get(rootNwChildChildren[2]);
        const nwSeChildAggregate = massAggregate.get(rootNwChildChildren[3]);

        expect(rootAggregate).toEqual({
            totalMass: 8,
            centerOfMass: { x: 57.25, y: 58.5 }
        });
        expect(nwChildAggregate).toEqual({
            totalMass: 4,
            centerOfMass: { x: 20, y: 20 }
        });
        expect(neChildAggregate).toEqual({
            totalMass: 0,
            centerOfMass: { x: 0, y: 0 }
        });
        expect(swChildAggregate).toEqual({
            totalMass: 0,
            centerOfMass: { x: 0, y: 0 }
        });
        expect(seChildAggregate).toEqual({
            totalMass: 4,
            centerOfMass: { x: 94.5, y: 97 }
        });
        expect(nwNwChildAggregate).toEqual({
            totalMass: 3,
            centerOfMass: { x: 10.333333333333332, y: 10.333333333333332 }
        });
        expect(nwNeChildAggregate).toEqual({
            totalMass: 0,
            centerOfMass: { x: 0, y: 0 }
        });
        expect(nwSwChildAggregate).toEqual({
            totalMass: 0,
            centerOfMass: { x: 0, y: 0 }
        });
        expect(nwSeChildAggregate).toEqual({
            totalMass: 1,
            centerOfMass: { x: 49, y: 49 }
        });
    });
});

test.describe("barnes-hut gravity", () => {
    test("two bodies, same leaf", () => {
        let testElementCounter = 0;
        const body1StartingX = 0;
        const body2StaringX = 4;
        const treeOptions = {
            position: new Vector2D(-10, -10),
            sideLength: 100,
            leafSize: 2,
            maxDepth: 32,
        }

        const objectState1: TestObjectState = {
            body: {
                mass: 1,
                movable: true
            },
            position: new Vector2D(body1StartingX, 0),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }
        const objectState2: TestObjectState = {
            body: {
                mass: 3,
                movable: true
            },
            position: new Vector2D(body2StaringX, 0),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }
        const tree = buildTree(treeOptions, objectState1, objectState2);
        
        const simulationState: Map<number, TestObjectState> = new Map()
        simulationState.set(++testElementCounter, objectState1);
        simulationState.set(++testElementCounter, objectState2);

        applyGravity(tree, simulationState, gravityParameters);

        expect(objectState1.position.x).toBeGreaterThan(body1StartingX);
        expect(objectState2.position.x).toBeLessThan(body2StaringX);
    });

    test("two bodies, different leaf", () => {
        let testElementCounter = 0;
        const body1StartingX = 10;
        const body2StaringX = 90;
        const treeOptions = {
            position: new Vector2D(0, 0),
            sideLength: 100,
            leafSize: 1,
            maxDepth: 32,
        }

        const objectState1: TestObjectState = {
            body: {
                mass: 1,
                movable: true
            },
            position: new Vector2D(body1StartingX, 0),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }
        const objectState2: TestObjectState = {
            body: {
                mass: 3,
                movable: true
            },
            position: new Vector2D(body2StaringX, 0),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }

        const tree = buildTree(treeOptions, objectState1, objectState2);        
        const simulationState: Map<number, TestObjectState> = new Map()
        simulationState.set(++testElementCounter, objectState1);
        simulationState.set(++testElementCounter, objectState2);

        applyGravity(tree, simulationState, gravityParameters);

        expect(objectState1.position.x).toBeGreaterThan(body1StartingX);
        expect(objectState1.position.x).toBeLessThan(body2StaringX);
    });

    test("four bodies, three of them clustered", () => {
        let testElementCounter = 0;
        const body1Starting = {x: 10, y: 10};
        const body2Starting = {x: 91, y: 89};
        const body3Starting = {x: 90, y: 90};
        const body4Starting = {x: 89, y: 91};
        const treeOptions = {
            position: new Vector2D(-50, -50),
            sideLength: 200,
            leafSize: 1,
            maxDepth: 32,
        }

        const objectState1: TestObjectState = {
            body: {
                mass: 20,
                movable: true
            },
            position: new Vector2D(body1Starting),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }
        const objectState2: TestObjectState = {
            body: {
                mass: 1,
                movable: true
            },
            position: new Vector2D(body2Starting),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }
        const objectState3: TestObjectState = {
            body: {
                mass: 1,
                movable: true
            },
            position: new Vector2D(body3Starting),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }
        const objectState4: TestObjectState = {
            body: {
                mass: 1,
                movable: true
            },
            position: new Vector2D(body4Starting),
            velocity: new Vector2D(),
            acceleration: new Vector2D()
        }

        const objectStates = [objectState1, objectState2, objectState3, objectState4];        
        const simulationState: Map<number, TestObjectState> = new Map()
        objectStates.forEach((state) => {
            simulationState.set(++testElementCounter, state);
        })
        
        const tree = buildTree(treeOptions, ...objectStates);
        applyGravity(tree, simulationState, gravityParameters);

        expect(objectState1.position.x).toBeGreaterThan(body1Starting.x);
        expect(objectState1.position.y).toBeGreaterThan(body1Starting.y);

        expect(objectState2.position.x).toBeLessThan(body2Starting.x);

        expect(objectState3.position.x).toBeLessThan(body3Starting.x);
        expect(objectState3.position.y).toBeLessThan(body3Starting.y);
        
        expect(objectState4.position.y).toBeLessThan(body4Starting.y);
    });
})

