import { expect, test } from "vitest";
import { QuadTree } from "../scripts/simulation/quad-tree";
import { Vector2D } from "../scripts/util/vector2d";
import { aggregateQuadtree } from "../scripts/simulation/barnes-hut";

interface TestElement {
    body: {
        id: number,
        mass: number
    },
    position: Vector2D,
}
const getElementPosition = (element: TestElement) => {
    return element.position;
}

test.describe("aggregate mass", () => {
    test("aggregate tree with two elements at root depth", () => {
        let testElementCounter = 0;
        const zeroVector = new Vector2D(0, 0);
        const treePosition = new Vector2D(0, 0);
        const sideLength = 100;
        const leafSize = 2;

        const tree: QuadTree<TestElement> = new QuadTree(getElementPosition, treePosition, sideLength, leafSize);
        const body1: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: zeroVector,
        }
        const body2: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 3
            },
            position: new Vector2D(4, 0),
        }

        tree.add(body1);
        tree.add(body2);

        const massAggregate = aggregateQuadtree(tree);
        const rootAggregate = massAggregate.get(tree.root);
        expect(rootAggregate).toEqual({
            totalMass: 4,
            centerOfMass: { x: 3, y: 0 } 
        })
    });

    test("aggregate tree with four elements at depth 1, one per leaf", () => {
        let testElementCounter = 0;
        const treePosition = new Vector2D(0, 0);
        const sideLength = 100;
        const leafSize = 1;

        const tree: QuadTree<TestElement> = new QuadTree(getElementPosition, treePosition, sideLength, leafSize);
        const body1: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(1, 1),
        }
        const body2: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(99, 1),
        }
        const body3: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(1, 99),
        }
        const body4: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(99, 99),
        }

        tree.add(body1);
        tree.add(body2);
        tree.add(body3);
        tree.add(body4);

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
        let testElementCounter = 0;
        const treePosition = new Vector2D(0, 0);
        const sideLength = 100;
        const leafSize = 2;

        const tree: QuadTree<TestElement> = new QuadTree(getElementPosition, treePosition, sideLength, leafSize);
        const body1: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(1, 1),
        }
        const body2: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(49, 49),
        }
        const body3: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 2
            },
            position: new Vector2D(99, 99),
        }

        tree.add(body1);
        tree.add(body2);
        tree.add(body3);

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
        let testElementCounter = 0;
        const treePosition = new Vector2D(0, 0);
        const sideLength = 100;
        const leafSize = 2;

        const tree: QuadTree<TestElement> = new QuadTree(getElementPosition, treePosition, sideLength, leafSize);
        const body1: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(1, 1),
        }
        const body2: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 2
            },
            position: new Vector2D(15, 15),
        }
        const body3: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 1
            },
            position: new Vector2D(49, 49),
        }
        const body4: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 2
            },
            position: new Vector2D(99, 99),
        }
        const body5: TestElement = {
            body: {
                id: ++testElementCounter,
                mass: 2
            },
            position: new Vector2D(90, 95),
        }

        tree.add(body1);
        tree.add(body2);
        tree.add(body3);
        tree.add(body4);
        tree.add(body5);
        
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
