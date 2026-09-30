import { Vector2D } from "@/util/vector2d.js";
import { isInside } from "@/util/util.js";

const MAXIMUM_LEAF_SIZE = 8;
interface Positionable {
    position: Vector2D,
}
type Leaf<T extends Positionable> = T[];
type NodeData<T extends Positionable> = Leaf<T> | QuadTreeNode<T>[];
export class QuadTreeNode<T extends Positionable> {
    constructor(
        public nodePosition: Vector2D, // top-left corner
        private _width: number,
        private _height: number,
        public data: NodeData<T>,
        private _isLeaf: boolean = true,
    ) { }

    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    private set width(width: number) {
        this._width = width;
    }
    private set height(height: number) {
        this._height = height;
    }
    private set isLeaf(leaf: boolean) {
        this._isLeaf = leaf;
    }

    get isLeaf() {
        return this._isLeaf;
    }
    get isEmpty() {
        return this.isLeaf && this.data.length === 0;
    }
    
    /**
     * Adds an element. Traverses the tree and generates an empty leaf if necessary.
     * @param element 
     * @returns 
     */
    public add(element: T) {
        if (this.isLeaf) {
            // leaf?
            if (this.data.length >= MAXIMUM_LEAF_SIZE) {
                // full?
                if ((this.data as Leaf<T>).some(leafElement => leafElement.position.equals(element.position))) {
                    // is identical with another point? -> Ignore size limit and add anyway
                    (this.data as Leaf<T>).push(element);
                } else {
                    // subdivide -> recursively add to child
                    this.subdivide();
                    this.add(element);
                }
            } else {
                // has space? -> add
                (this.data as Leaf<T>).push(element);
            }
        } else {
            // internal? find targetChildNode -> Add recursively
            const targetChildNode = this.getChildNodeContaining(element);
            if (targetChildNode) {
                targetChildNode.add(element);
            } else {
                throw new Error(`Cannot add element ${element} that lies outside the node's bounds.`);
            }
        }
    }
    /**
     * Subdivides a leaf-node. If the node is not a leaf OR the node is an empty leaf, nothing happens.
     * @returns The generated Child-nodes. If no nodes a generated, return null
     */
    private subdivide(): QuadTreeNode<T>[] | null {
        if (!this.isLeaf || this.isEmpty) {
            return null;
        }
        
        const leafElements = this.data as Leaf<T>;
        const newWidth = this.width / 2;
        const newHeight = this.height / 2;
        const northWestLeaf = new QuadTreeNode<T>(this.nodePosition, newWidth, newHeight, []);
        const northEastLeaf = new QuadTreeNode<T>(this.nodePosition.add(new Vector2D(newWidth, 0)), newWidth, newHeight, []);
        const southWestLeaf = new QuadTreeNode<T>(this.nodePosition.add(new Vector2D(0, newHeight)), newWidth, newHeight, []);
        const southEastLeaf = new QuadTreeNode<T>(this.nodePosition.add(new Vector2D(newWidth, newHeight)), newWidth, newHeight, []);

        leafElements.forEach((leafElement) => {
            if (northWestLeaf.hasWithinBounds(leafElement.position)) {
                (northWestLeaf.data as Leaf<T>).push(leafElement);
            } else if (northEastLeaf.hasWithinBounds(leafElement.position)) {
                (northEastLeaf.data as Leaf<T>).push(leafElement);
            } else if (southWestLeaf.hasWithinBounds(leafElement.position)) {
                (southWestLeaf.data as Leaf<T>).push(leafElement);
            } else if (southEastLeaf.hasWithinBounds(leafElement.position)) {
                (southEastLeaf.data as Leaf<T>).push(leafElement);
            } else {
                throw new Error("After subdividing, the position of the element is not in any of the child-nodes.");
            }
        });

        const children = [northWestLeaf, northEastLeaf, southWestLeaf, southEastLeaf];
        this.data = children;
        
        this.isLeaf = false;

        return children;
    }
    private getChildNodes(): QuadTreeNode<T>[] | null {
        if (!this.isLeaf) {
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

        const position = element.position;
        if (children[0].hasWithinBounds(position)) { return children[0]; }
        else if (children[1].hasWithinBounds(position)) {  return children[1]; }
        else if (children[2].hasWithinBounds(position)) { return children[2]; }
        else if (children[3].hasWithinBounds(position)) { return children[3]; }
        else { return null; }
    }
    public hasWithinBounds(point: Vector2D): boolean {
        return isInside(point, this.nodePosition, this.width, this.height);
    }
}

export class QuadTree<T extends Positionable> {
    public root: QuadTreeNode<T>;
    constructor(
        public position: Vector2D,
        public width: number,
        public height: number
    ) {
        this.root = new QuadTreeNode<T>(position, width, height, []);
    }
    public add(data: T) {
        this.root.add(data);
    }
}



