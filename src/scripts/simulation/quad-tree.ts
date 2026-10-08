import { Vector2D } from "@/util/vector2d.js";
import { isInside } from "@/util/util.js";

type GetPosition<T> = (element: T) => Vector2D;
type Leaf<T> = T[];
type NodeData<T> = Leaf<T> | QuadTreeNode<T>[];
export class QuadTreeNode<T> {
    constructor(
        public nodePosition: Vector2D, // top-left corner
        private _sideLength: number,
        public data: NodeData<T>,
        private _isLeaf: boolean = true,
        private _depth: number = 0,
        private _tree: QuadTree<T>
    ) { }

    get sideLength() {
        return this._sideLength;
    }
    get depth() {
        return this._depth;
    }
    private set sideLength(length: number) {
        this._sideLength = length;
    }
    get isEmpty() {
        return this._isLeaf && this.data.length === 0;
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
        if (!this.hasWithinBounds(this._tree.getPosition(element))) {
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
                if (this.data.some(leafElement => this._tree.getPosition(leafElement).equals(this._tree.getPosition(element)))) {
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
     * @returns The generated Child-nodes. If no nodes a generated, return null
     */
    private subdivide(): QuadTreeNode<T>[] | null {
        if (!this._isLeaf || this.isEmpty) {
            return null;
        }
        
        const leafElements = this.data as Leaf<T>;
        const newSideLength = this.sideLength / 2;
        const northWestLeaf = new QuadTreeNode<T>(this.nodePosition, newSideLength, [], true, this._depth + 1, this._tree);
        const northEastLeaf = new QuadTreeNode<T>(this.nodePosition.add(new Vector2D(newSideLength, 0)), newSideLength, [], true, this._depth + 1, this._tree);
        const southWestLeaf = new QuadTreeNode<T>(this.nodePosition.add(new Vector2D(0, newSideLength)), newSideLength, [], true, this._depth + 1, this._tree);
        const southEastLeaf = new QuadTreeNode<T>(this.nodePosition.add(new Vector2D(newSideLength, newSideLength)), newSideLength, [], true, this._depth + 1, this._tree);

        leafElements.forEach((leafElement) => {
            if (northWestLeaf.hasWithinBounds(this._tree.getPosition(leafElement))) {
                (northWestLeaf.data as Leaf<T>).push(leafElement);
            } else if (northEastLeaf.hasWithinBounds(this._tree.getPosition(leafElement))) {
                (northEastLeaf.data as Leaf<T>).push(leafElement);
            } else if (southWestLeaf.hasWithinBounds(this._tree.getPosition(leafElement))) {
                (southWestLeaf.data as Leaf<T>).push(leafElement);
            } else if (southEastLeaf.hasWithinBounds(this._tree.getPosition(leafElement))) {
                (southEastLeaf.data as Leaf<T>).push(leafElement);
            } else {
                throw new Error("After subdividing, the position of the element is not in any of the child-nodes.");
            }
        });

        const children = [northWestLeaf, northEastLeaf, southWestLeaf, southEastLeaf];
        this.data = children;
        
        this._isLeaf = false;

        return children;
    }
    public getChildNodes(): QuadTreeNode<T>[] | null {
        if (!this.isLeafNode()) {
            return this.data as QuadTreeNode<T>[];
        } else {
            return null;
        }
    }
    private getChildNodeContaining(element: T): QuadTreeNode<T> | null {
        const children = this.getChildNodes();
        if (children === null) {
           return null;
        }

        const position = this._tree.getPosition(element);
        if (children[0].hasWithinBounds(position)) { return children[0]; }
        else if (children[1].hasWithinBounds(position)) { return children[1]; }
        else if (children[2].hasWithinBounds(position)) { return children[2]; }
        else if (children[3].hasWithinBounds(position)) { return children[3]; }
        else { return null; }
    }
    public hasWithinBounds(point: Vector2D): boolean {
        return isInside(point, this.nodePosition, this.sideLength, this.sideLength);
    }
    public toString() {
        return `node type: ${this.isLeafNode() ? 'Leaf' : 'Internal'}
            depth: ${this._depth}
            position: ${this.nodePosition.toString()}
            size: ${this._sideLength} * ${this._sideLength}
            ${this.isLeafNode() ?
                `Contains ${this.data.length} elements: ${this.data.map(body => this._tree.getPosition(body).toString()).join(" - ")}` :
                ``
            }
        `
    }
    public printNode(recurse = true) {
        console.log(this.toString());
        if (recurse) {
            this.getChildNodes()?.forEach(node => {
                node.printNode(recurse);
            });
        }
    }
}

export class QuadTree<T> {
    public root: QuadTreeNode<T>;
    constructor(
        public getPosition: GetPosition<T>,
        public position: Vector2D,
        private _sideLength: number,
        private _maxLeafSize: number = 8,
        private _maxDepth: number = 32,
    ) {
        this.root = new QuadTreeNode<T>(position, _sideLength, [], true, 0, this);
    }
    public get maxLeafSize() {
        return this._maxLeafSize;
    }
    public get maxDepth() {
        return this._maxDepth;
    }
    public add(data: T) {
        this.root.add(data);
    }
    public empty() {
        this.root.empty();
    }
    public resize(newSideLength: number) {
        this._sideLength = newSideLength;
    }
    public printTree() {
        this.root.printNode();
    }
    /**
     * Breadth first searches the tree.
     * @returns an array of QuadTreeNode\<T>
     */
    public getAllNodes(): QuadTreeNode<T>[] {
        const nodes = [this.root];

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const children = node.getChildNodes();
            if (children) {
                nodes.push(...children);
            }
        }

        return nodes;
    }
}
