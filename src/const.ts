import { ButtonState, Mouse } from "./scripts/types";

//#region physics
export const DEFAULT_G = 50;
export const MIN_G = -10;
export const MAX_G = 100;
//#endregion

//#region animation
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 10000;
export const VECTOR_THICKNESS = 1.5;
//#endregion

//#region other global stuff
export const MOUSE: Mouse = { main: { state: ButtonState.Up, downCoordinatesInSimSpace: undefined }, 
                     secondary: { state: ButtonState.Up }, 
                     wheel: { state: ButtonState.Up} };
//#endregion
