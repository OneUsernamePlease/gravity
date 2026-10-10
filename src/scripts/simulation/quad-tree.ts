import { Vector2D } from "@/util/vector2d.js";
import { isInside } from "@/util/util.js";
import { Rectangle } from "@/types/types.js";

type GetPosition<T> = (element: T) => Vector2D;
type Leaf<T> = T[];
type InternalNode<T> = {
    NW: QuadtreeNode<T>;
    NE: QuadtreeNode<T>;
    SW: QuadtreeNode<T>;
    SE: QuadtreeNode<T>;
};
type NodeData<T> = Leaf<T> | InternalNode<T>;
export class QuadtreeNode<T> {
    constructor(
        private _tree: Quadtree<T>,
        private _position: Vector2D, // top-left corner
        private _sideLength: number,
        public data: NodeData<T>,
        private _isLeaf: boolean = true,
        private _depth: number = 0,
        private isRoot: boolean = false,
    ) { }

    get sideLength() {
        return this._sideLength;
    }
    private set sideLength(length: number) {
        this._sideLength = length;
    }
    get position() {
        return this._position;
    }
    private set position(position: Vector2D) {
        this._position = position;
    }
    get depth() {
        return this._depth;
    }
    get isEmpty() {
        return this.isLeafNode() && this.data.length === 0;
    }
    /**
     * Has to be called on the root, children's sizes come from their parent.
     * @param newSideLength 
     */
    public setBounds(bounds: {position?: Vector2D, sideLength?: number}) {
        if (!this.isRoot) {
            console.log(`setBounds can only be called on the root.`)
            return;
        }

        if (bounds.position !== undefined) {
            this.position = bounds.position;
        }
        if (bounds.sideLength !== undefined) {
            this.sideLength = bounds.sideLength;
        }
        
    }
    public isLeafNode(): this is { data: Leaf<T> } {
        return this._isLeaf;
    }
    public empty() {
        this.data = [];
        this._isLeaf = true;
    }
    /**
     * Adds an element. Traverses the tree and generates nodes if necessary.
     * @param element 
     * @returns 
     */
    public add(element: T) {
        if (!this.hasWithinBounds(this._tree.getElementPosition(element))) {
            throw new Error(`Cannot add element ${element} that lies outside the node's bounds.`);
        }

        const addToChild = (element: T) => {
            const targetChildNode = this.getChildNodeContaining(element);
            if (!targetChildNode) throw new Error("No child-node containing the element found.");
            targetChildNode.add(element);
        }

        if (this.isLeafNode()) {
            // leaf?
            if (this.data.length >= this._tree.maxLeafSize &&
                this._depth < this._tree.maxDepth
            ) {
                // full and not too deep?
                if (this.data.some(leafElement => this._tree.getElementPosition(leafElement).equals(this._tree.getElementPosition(element)))) {
                    // is identical with another point? -> Ignore size limit and add anyway
                    this.data.push(element);
                } else {
                    // subdivide -> recursively add to child
                    this.subdivide();
                    addToChild(element);
                }
            } else {
                // has space? -> add
                this.data.push(element);
            }
        } else {
            // internal? find targetChildNode -> Add recursively
            addToChild(element);
        }
    }
    /**
     * Subdivides a leaf-node. If the node is not a leaf OR the node is an empty leaf, nothing happens.
     * @returns The generated Child-nodes. If no nodes are generated, return null
     */
    private subdivide(): InternalNode<T> | null {
        if (!this._isLeaf || this.isEmpty) {
            return null;
        }
        
        const leafElements = this.data as Leaf<T>;
        const newSideLength = this.sideLength / 2;
        const northWestLeaf = new QuadtreeNode<T>(this._tree, this._position, newSideLength, [], true, this._depth + 1);
        const northEastLeaf = new QuadtreeNode<T>(this._tree, this._position.add(new Vector2D(newSideLength, 0)), newSideLength, [], true, this._depth + 1);
        const southWestLeaf = new QuadtreeNode<T>(this._tree, this._position.add(new Vector2D(0, newSideLength)), newSideLength, [], true, this._depth + 1);
        const southEastLeaf = new QuadtreeNode<T>(this._tree, this._position.add(new Vector2D(newSideLength, newSideLength)), newSideLength, [], true, this._depth + 1);

        leafElements.forEach((leafElement) => {
            if (northWestLeaf.hasWithinBounds(this._tree.getElementPosition(leafElement))) {
                (northWestLeaf.data as Leaf<T>).push(leafElement);
            } else if (northEastLeaf.hasWithinBounds(this._tree.getElementPosition(leafElement))) {
                (northEastLeaf.data as Leaf<T>).push(leafElement);
            } else if (southWestLeaf.hasWithinBounds(this._tree.getElementPosition(leafElement))) {
                (southWestLeaf.data as Leaf<T>).push(leafElement);
            } else if (southEastLeaf.hasWithinBounds(this._tree.getElementPosition(leafElement))) {
                (southEastLeaf.data as Leaf<T>).push(leafElement);
            } else {
                throw new Error("After subdividing, the position of the element is not in any of the child-nodes.");
            }
        });

        const children = {
            NW: northWestLeaf,
            NE: northEastLeaf,
            SW: southWestLeaf,
            SE: southEastLeaf,
        };
        this.data = children;
        
        this._isLeaf = false;

        return children;
    }
    public getChildNodes(): InternalNode<T> | null {
        if (!this.isLeafNode()) {
            return this.data as InternalNode<T>;
        } else {
            return null;
        }
    }
    private getChildNodeContaining(element: T): QuadtreeNode<T> | null {
        const children = this.getChildNodes();
        if (children === null) {
           return null;
        }

        const position = this._tree.getElementPosition(element);
        if (children.NW.hasWithinBounds(position)) { return children.NW; }
        else if (children.NE.hasWithinBounds(position)) { return children.NE; }
        else if (children.SW.hasWithinBounds(position)) { return children.SW; }
        else if (children.SE.hasWithinBounds(position)) { return children.SE; }
        else { return null; }
    }
    public hasWithinBounds(point: Vector2D): boolean {
        return isInside(point, this._position, this.sideLength, this.sideLength);
    }
    public toString() {
        return `node type: ${this.isLeafNode() ? 'Leaf' : 'Internal'}
            depth: ${this._depth}
            position: ${this._position.toString()}
            size: ${this._sideLength} * ${this._sideLength}
            ${this.isLeafNode() ?
                `Contains ${this.data.length} elements: ${this.data.map(body => this._tree.getElementPosition(body).toString()).join(" - ")}` :
                ``
            }
        `
    }
    public printNode(recurse = true) {
        console.log(this.toString());
        if (recurse) {
            const children = this.getChildNodes();
            children?.NW.printNode(recurse);
            children?.NE.printNode(recurse);
            children?.SW.printNode(recurse);
            children?.SE.printNode(recurse);
        }
    }
}

export class Quadtree<T> {
    public root: QuadtreeNode<T>;
    constructor(
        public getElementPosition: GetPosition<T>,
        private _position: Vector2D,
        private _sideLength: number,
        private _maxLeafSize: number = 8,
        private _maxDepth: number = 32,
        private _padding: number = 100
    ) {
        this.root = new QuadtreeNode<T>(this, _position, _sideLength, [], true, 0, true);

    }
    get maxLeafSize() {
        return this._maxLeafSize;
    }
    get maxDepth() {
        return this._maxDepth;
    }
    add(element: T) {
        this.root.add(element);
    }
    empty() {
        this.root.empty();
    }
    setBounds(bounds: {origin: Vector2D, sideLength: number}) {
        if (bounds.origin !== undefined) this.reposition(bounds.origin);
        if (bounds.sideLength !== undefined) this.resize(bounds.sideLength);
    }
    setBoundsFromRect(rect: Rectangle | null) {
        let origin: Vector2D;
        let sideLength: number;

        if (rect === null) {
            origin = new Vector2D();
            sideLength = 0;
        } else {
            sideLength = Math.max(rect.maxX - rect.minX, rect.maxY - rect.minY);
            origin = new Vector2D(rect.minX, rect.minY)
        }

        this.setBounds({ origin, sideLength });
    }
    private resize(newSideLength: number) {
        this._sideLength = newSideLength;
        this.root.setBounds({sideLength: newSideLength});
    }
    private reposition(newPosition: Vector2D) {
        this._position = newPosition;
        this.root.setBounds({position: newPosition});
    }
    reset() {
        this.empty();
        this.setBounds({
            origin: new Vector2D(),
            sideLength: 0,
        });
    }
    printTree() {
        this.root.printNode();
    }
    /**
     * Breadth first searches the tree.
     * @returns an array of QuadtreeNode\<T>
     */
    getAllNodes(): QuadtreeNode<T>[] {
        const nodes = [this.root];

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const children = node.getChildNodes();
            if (children) {
                nodes.push(children.NW, children.NE, children.SW, children.SE);
            }
        }

        return nodes;
    }
}
