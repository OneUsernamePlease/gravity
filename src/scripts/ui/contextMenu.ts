import { ContextMenuItem } from "../types/types.js";
import { Vector2D } from "../util/vector2d.js";

export class ContextMenu {
    private element: HTMLDivElement;
    private _isOpen = false;
    
    get isOpen() {
        return this._isOpen;
    }
    private set isOpen(open: boolean) {
        this._isOpen = open;
    }

    constructor () {
        this.element = document.createElement("div");
        
        this.element.className = `
            fixed z-50 min-w-[180px]
            rounded-xl border border-zinc-700
            bg-zinc-900/95 backdrop-blur
            p-1 shadow-2xl
            text-sm text-zinc-100
            hidden
        `
        document.body.appendChild(this.element);
    }
    open(absolutePosition: Vector2D,
         entries: ({ label: string; action: () => void; })[]
        ) {
        // render menu items
        this.clearEntries();
        this.renderEntries(entries);

        // position menu
        this.element.style.left = `${absolutePosition.x}px`;
        this.element.style.top = `${absolutePosition.y}px`;

        // show temporarily so dimensions can be measured
        this.element.classList.remove('hidden');

        // prevent overflow outside viewport
        const rect = this.element.getBoundingClientRect();

        let x = absolutePosition.x;
        let y = absolutePosition.y;

        const padding = 8;

        if (rect.right > window.innerWidth) {
            x = window.innerWidth - rect.width - padding;
        }

        if (rect.bottom > window.innerHeight) {
            y = window.innerHeight - rect.height - padding;
        }

        // clamp to viewport
        x = Math.max(padding, x);
        y = Math.max(padding, y);

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        this.isOpen = true;
    }
    close () {
        this.element.classList.add('hidden');
        this.isOpen = false;
    }
    private clearEntries() {
        this.element.innerHTML = '';
    }
    private renderEntries(entries: ContextMenuItem[]) {
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

        this.element.appendChild(button);
        }
    }
}
