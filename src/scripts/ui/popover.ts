import { MenuItem, PopoverOptions } from "@/types/types.js";
import { FloatingElement } from "@/ui/floating-element.js"

export class Popover extends FloatingElement<MenuItem> {
    constructor (options?: PopoverOptions) {
        const className = options?.className ? options.className : `
            fixed w-max min-w-40 max-w-64
            rounded-xl border border-zinc-700
            bg-zinc-900/95 backdrop-blur
            p-1 shadow-2xl
            text-sm text-zinc-100
        `;

        super({
            tagName: options?.tagName,
            className,
            alignment: options?.alignment,
            onOverflow: options?.onOverflow
        });

        this._element.addEventListener("contextmenu", (ev) => { ev.preventDefault(); })
    }
    protected override render(entries: MenuItem[], addCancel: boolean = true) {
        const buttonBaseClasses = `
            block w-full rounded-lg px-3 py-2
            text-left whitespace-nowrap transition-colors
            hover:bg-zinc-800
        `;
        
        for (const entry of entries) {
            const button = document.createElement('button');

            button.className = `
                ${buttonBaseClasses}
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
        
        if (addCancel) {
            const cancelButton = document.createElement('button');
            cancelButton.className = buttonBaseClasses;

            cancelButton.textContent = 'Cancel';
            cancelButton.onclick = () => this.close();

            this._element.appendChild(cancelButton);
        }
    }
}
