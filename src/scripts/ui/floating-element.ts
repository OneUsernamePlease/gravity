import { FloatingElementAlignment, FloatingElementOverflow } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
export abstract class FloatingElement<T> {
    protected _element: HTMLElement;
    protected _isOpen = false;
    protected _padding = 6;
    protected _zIndexClass = "z-100";
    protected _onOverflow: FloatingElementOverflow = "shift";
    protected _alignment: FloatingElementAlignment = "bottom-right";
    get isOpen() {
        return this._isOpen;
    }
    set alignment(alignment: FloatingElementAlignment) {
        this._alignment = alignment;
    }
    set onOverflow(onOverflow: FloatingElementOverflow) {
        this._onOverflow = onOverflow;
    }
    constructor(
        tagName: keyof HTMLElementTagNameMap,
        options?: {
            className?: string,
            alignment?: FloatingElementAlignment,
            onOverflow?: FloatingElementOverflow,
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
        
        this._element.classList.remove("hidden");

        const elementPosition = this.calculateElementPosition(anchor);

        this._element.style.left = `${elementPosition.x}px`;
        this._element.style.top = `${elementPosition.y}px`;

        this._isOpen = true;
    }
    close() {
        this._element.classList.add('hidden');
        this._isOpen = false;
    }
    private clearContent() {
        this._element.replaceChildren();
    }
    private calculateElementPosition(anchor: Vector2D): Vector2D {
        let x = anchor.x;
        let y = anchor.y;

        this._element.style.left = `${x}px`;
        this._element.style.top = `${y}px`;

        const box = this._element.getBoundingClientRect();

        if (box.right > window.innerWidth - this._padding) {
            const overflow = box.right - window.innerWidth + this._padding;
            x = anchor.x - overflow;
        }
        if (box.bottom > window.innerHeight - this._padding) {
            const overflow = box.bottom - window.innerHeight + this._padding;
            y = anchor.y - overflow;
        }
        
        x = Math.max(this._padding, x);
        y = Math.max(this._padding, y);

        return new Vector2D(x, y);
    }
}