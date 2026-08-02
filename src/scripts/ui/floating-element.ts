import { Alignment, OnOverflow, Overflow } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
export abstract class FloatingElement<T> {
    protected _element: HTMLElement;
    protected _isOpen = false;
    protected _padding = 6;
    protected _zIndexClass = "z-100";
    protected _onOverflow: OnOverflow = "shift";
    protected _alignment: Alignment = "bottom-right";
    get isOpen() {
        return this._isOpen;
    }
    set alignment(alignment: Alignment) {
        this._alignment = alignment;
    }
    set onOverflow(onOverflow: OnOverflow) {
        this._onOverflow = onOverflow;
    }
    constructor(
        tagName: keyof HTMLElementTagNameMap,
        options?: {
            className?: string,
            alignment?: Alignment,
            onOverflow?: OnOverflow,
        }
    ) {
        this._element = document.createElement(tagName);

        if (options?.className) this._element.className = options.className;
        if (options?.alignment) this._alignment = options.alignment;
        if (options?.onOverflow) this._onOverflow = options.onOverflow;

        this._element.classList.add("hidden");
        this._element.classList.add(this._zIndexClass);

        document.body.appendChild(this._element);
    }

    protected abstract render(source: T[]): void;
    
    open(anchor: Vector2D, ...data: T[]) {
        this.clearContent();
        this.render(data);
        this.positionElement(anchor);

        this._isOpen = true;
    }
    close() {
        this._element.classList.add('hidden');
        this._isOpen = false;
    }
    private clearContent() {
        this._element.replaceChildren();
    }
    private clampSize() {
        
    }
    private positionElement(anchor: Vector2D): void {
        this._element.classList.remove("hidden");

        this._element.style.left = `${anchor.x}px`;
        this._element.style.top = `${anchor.y}px`;

        const box = this._element.getBoundingClientRect();
        const { width, height } = box;

        if (width === 0 || height === 0) {
            return;
        }

        let fixedPosition = this.getAlignedPosition(anchor, box, this._alignment);
        this.setCssPosition(fixedPosition);
        
        if (this._onOverflow === "none") {
            return;
        }

        if (this._onOverflow === "flip") {
            const overflow = this.measureOverflow();
            let fixedAlignment = this.fixAlignment(this._alignment, overflow);
            fixedPosition = this.getAlignedPosition(anchor, box, fixedAlignment);
            
            this.setCssPosition(fixedPosition);
        }

        // "shift"
        const overflow = this.measureOverflow();
        fixedPosition = this.getShiftedPosition(fixedPosition, overflow);

        this.setCssPosition(fixedPosition);
    }
    private getAlignedPosition(anchor: Vector2D, box: DOMRectReadOnly, alignment: Alignment): Vector2D {
        const x = anchor.x;
        const y = anchor.y;
        switch (alignment) {
            case "top-left":
                return new Vector2D(x - box.width, y - box.height);

            case "top":
                return new Vector2D(x - box.width / 2, y - box.height);

            case "top-right":
                return new Vector2D(x, y - box.height);
                
            case "right":
                return new Vector2D(x, y - box.height / 2);

            case "bottom-right":
                return new Vector2D(x, y);

            case "bottom":
                return new Vector2D(x - box.width / 2, y);

            case "bottom-left":
                return new Vector2D(x - box.width, y);

            case "left":
                return new Vector2D(x - box.width, y - box.height / 2);
        
            default:
                const _exhaustive: never = alignment;
                throw new Error(`Invalid alignment: ${alignment}`);
        }
    }
    private getShiftedPosition(position: Vector2D, overflow: Overflow): Vector2D {
        const newPosition = new Vector2D();

        newPosition.x = position.x - overflow.right + overflow.left;
        newPosition.y = position.y - overflow.bottom + overflow.top;

        return newPosition;
    }
    private measureOverflow(): Overflow {
        const box = this._element.getBoundingClientRect();
        const padding = this._padding;
        return {
            top: Math.max(0, padding - box.top),
            right: Math.max(0, box.right - window.innerWidth + padding),
            bottom: Math.max(0, box.bottom - window.innerHeight + padding),
            left: Math.max(0, padding - box.left)
        }
    }
    private fixAlignment(alignment: Alignment, overflow: Overflow): Alignment {            
        const overflowTop = overflow.top > 0;
        const overflowBottom = overflow.bottom > 0;
        const overflowLeft = overflow.left > 0;
        const overflowRight = overflow.right > 0;
        let fixedAlignment = this._alignment;

        // Basically XOR
        if (overflowTop !== overflowBottom) {
            fixedAlignment = FloatingElement.FLIP_VERTICAL[alignment];
        }
        if (overflowLeft !== overflowRight) {
            fixedAlignment = FloatingElement.FLIP_HORIZONTAL[alignment];
        }

        return fixedAlignment;
    }
    private setCssPosition(position: Vector2D) {
        this._element.style.left = `${position.x}px`;
        this._element.style.top = `${position.y}px`;
    }
    private static readonly FLIP_VERTICAL: Record<Alignment, Alignment> = {
        "top-left": "bottom-left",
        "top": "bottom",
        "top-right": "bottom-right",

        "right": "right",

        "bottom-right": "top-right",
        "bottom": "top",
        "bottom-left": "top-left",

        "left": "left",
    };
    private static readonly FLIP_HORIZONTAL: Record<Alignment, Alignment> = {
        "top-left": "top-right",
        "top": "top",
        "top-right": "top-left",

        "right": "left",

        "bottom-right": "bottom-left",
        "bottom": "bottom",
        "bottom-left": "bottom-right",

        "left": "right",
    };
}