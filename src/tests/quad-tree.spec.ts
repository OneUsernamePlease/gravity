import { expect, test } from "vitest";
import { QuadTree } from "../scripts/simulation/quad-tree.js";
import { Vector2D } from "../scripts/util/vector2d.js";

interface TestElement {
    id: number,
    position: Vector2D
}
const getElementPosition = (element: TestElement) => {
    return element.position;
}
test.describe("build a tree", () => {
    test("build a tree with elements very close together - depth 6", () => {
        let testElementCounter = 0;
        const treePosition = new Vector2D(0, 0);
        const sideLength = 100;
        const leafSize = 2;
        const tree: QuadTree<TestElement> = new QuadTree(getElementPosition, treePosition, sideLength, leafSize);
    
        tree.add({id: ++testElementCounter, position: new Vector2D(10, 1) });
        tree.add({id: ++testElementCounter, position: new Vector2D(10.5, 1) });
        tree.add({id: ++testElementCounter, position: new Vector2D(11, 1) });
    
        const nodes = tree.getAllNodes();

        expect(nodes.some(node => (node.depth === 6))).toBeTruthy();
        expect(nodes.some(node => (node.depth === 7))).toBeFalsy();
    });

    test("build a tree with elements close together - depth 3", () => {
        let testElementCounter = 0;
        const treePosition = new Vector2D(0, 0);
        const sideLength = 100;
        const leafSize = 2;
        const tree: QuadTree<TestElement> = new QuadTree(getElementPosition, treePosition, sideLength, leafSize);
    
        tree.add({id: ++testElementCounter, position: new Vector2D(10, 10) });
        tree.add({id: ++testElementCounter, position: new Vector2D(13, 13) });
        tree.add({id: ++testElementCounter, position: new Vector2D(14, 14) });

        const nodes = tree.getAllNodes();
        
        expect(nodes.some(node => (node.depth === 3))).toBeTruthy();
        expect(nodes.some(node => (node.depth === 4))).toBeFalsy();
    });
})



