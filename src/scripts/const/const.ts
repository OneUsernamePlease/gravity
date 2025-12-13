
//#region physics
export const DEFAULT_G = 50;
export const MIN_G = -10;
export const MAX_G = 100;
//#endregion

//#region animation
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 100;
export const DEFAULT_ZOOM_FACTOR = 0.075;
export const DEFAULT_SCROLL_RATE = 0.1;
export const VECTOR_THICKNESS = 1;
export const MIN_DISPLAYED_RADIUS = 0.75;
export const BACKGROUND_COLOR = "#222222ff";
export const VECTOR_COLORS: Map<string, {hex: string, name: string}> = new Map()
    .set("acceleration",    { hex: "#20ff20ff", name: "Green" })
    .set("velocity",        { hex: "#ffd700ff", name: "Yellow" });
//#endregion
