import { ButtonState, Mouse } from "./scripts/types";

//#region numbers
export const DEFAULT_G = 50;
export const MIN_G = -10;
export const MAX_G = 100;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 10000;
//#endregion

//#region other global stuff
export const MOUSE: Mouse = { main: { state: ButtonState.Up, downCoordinatesInSimSpace: undefined }, 
                     secondary: { state: ButtonState.Up }, 
                     wheel: { state: ButtonState.Up} };
//#endregion
