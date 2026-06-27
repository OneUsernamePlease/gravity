import { ContextMenuItem } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";
import { FloatingElement } from "./floating-element.js";

export class ContextMenu extends FloatingElement<ContextMenuItem> {
    get isOpen() {
        return this._isOpen;
    }

    constructor () {
        const className = `
            fixed min-w-45
            rounded-xl border border-zinc-700
            bg-zinc-900/95 backdrop-blur
            p-1 shadow-2xl
            text-sm text-zinc-100
        `

        super("div", className);
    }
    protected override render(entries: ContextMenuItem[]) {
        for (const entry of entries) {
        const button = document.createElement('button');

        button.className = `
            w-full rounded-lg px-3 py-2
            text-left transition-colors
            hover:bg-zinc-800
            disabled:opacity-40
            disabled:pointer-events-none
            ${entry.highlighted ? 'text-red-400': ''}
        `;

        button.textContent = entry.label;
        button.disabled = !!entry.disabled;

        button.onclick = () => {
            entry.action();
            this.close();
        }

        this._element.appendChild(button);
        }
    }
}
