import { ButtonState, Mouse } from "./scripts/types";

//#region numbers
export const DEFAULT_G = 50;
export const MIN_G = -10;
export const MAX_G = 100;
//#endregion

//#region other global stuff
export const mouse: Mouse = { main: { state: ButtonState.Up, downCoordinates: null, downCoordinatesInSimSpace: undefined }, 
                     secondary: { state: ButtonState.Up, downCoordinates: null }, 
                     wheel: { state: ButtonState.Up, downCoordinates: null} };
//#endregion
