import { Vector2D } from "../util/vector2d.js";

export abstract class FloatingElement<T> {
    protected _element: HTMLElement;
    protected _isOpen = false;
    protected _padding = 8;
    protected _zIndexClass = "z-100";
    constructor(
        tagName: keyof HTMLElementTagNameMap,
        className?: string,

    ) {
        this._element = document.createElement(tagName);

        if (className) this._element.className = className;
        this._element.classList.add("hidden");
        this._element.classList.add(this._zIndexClass);

        document.body.appendChild(this._element);
    }

    protected abstract render(source: T[]): void;
    
    open(position: Vector2D, ...data: T[]) {
        this.clearContent();
        this.render(data);
        
        this._element.classList.remove("hidden");
        
        let x = position.x;
        let y = position.y;

        this._element.style.left = `${x}px`;
        this._element.style.top = `${y}px`;

        const box = this._element.getBoundingClientRect();

        if (box.right > window.innerWidth - this._padding) {
            const overflow = box.right - window.innerWidth;
            x = position.x - overflow;
            x = Math.max(this._padding, x);
        }
        if (box.bottom > window.innerHeight - this._padding) {
            const overflow = box.bottom - window.innerHeight;
            y = position.y - overflow;
            y = Math.max(this._padding, y);
        }
        
        this._element.style.left = `${x}px`;
        this._element.style.top = `${y}px`;

        this._isOpen = true;
    }
    close() {
        this._element.classList.add('hidden');
        this._isOpen = false;
    }
    private clearContent() {
        this._element.replaceChildren();
    }
}