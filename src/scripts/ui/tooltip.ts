import { FloatingElement } from "./floating-element.js"

export class Tooltip extends FloatingElement<string> {
    constructor () {
        const className = `
            fixed min-w-45
            rounded-xl border border-zinc-700
            bg-zinc-900/95 backdrop-blur
            p-1 shadow-2xl
            text-sm text-zinc-100
        `

        super("div", className);

        this._element.addEventListener("contextmenu", (ev) => { ev.preventDefault(); })
        this._element.addEventListener("mousedown", () => { this.close(); })
    }
    protected override render(source: string[]): void {
        let text = "";

        source.forEach((s) => {
            text += `${s} \n`
        });

        this._element.innerHTML = text;
    }
}
